/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { generateKeyPairSync } from "crypto";
import * as dgram from "dgram";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import {
  CallRecordWriter,
  FsWorkingStore,
  MemoryAnalyticsSink,
  ObjectStore,
  RecordEntry,
  RecordIndexEntry,
  Recorder,
  RecordStore,
  S3ObjectStore,
  assembleRecording,
  decodeVcon,
  fsStores,
  rebuildAnalytics,
  verifyRecord,
  wavChannels
} from "../src";

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256"
});
const KEY = {
  kid: "k1",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};
const KEYS = {
  k1: publicKey.export({ type: "spki", format: "pem" }).toString()
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One RTP packet of L16 (big-endian) samples, all set to `value`. */
function l16Packet(seq: number, ts: number, samples: number, value: number) {
  const p = Buffer.alloc(12 + samples * 2);
  p[0] = 0x80;
  p[1] = 96;
  p.writeUInt16BE(seq, 2);
  p.writeUInt32BE(ts >>> 0, 4);
  p.writeUInt32BE(1234, 8);
  for (let i = 0; i < samples; i++) p.writeInt16BE(value, 12 + i * 2);
  return p;
}

async function send(port: number, packets: Buffer[]) {
  const s = dgram.createSocket("udp4");
  for (const p of packets) {
    await new Promise<void>((r) => s.send(p, port, "127.0.0.1", () => r()));
  }
  s.close();
}

let t = 1_700_000_000_000;
const at = () => (t += 100);

function call(callRef: string, opts: { recording?: boolean } = {}) {
  const entries: RecordEntry[] = [
    {
      at: at(),
      source: "event",
      message: {
        type: "call.started",
        direction: "inbound",
        appRef: "ivr",
        workspaceRef: "ws-1",
        from: "+15550001111",
        to: "+15550002222"
      }
    },
    {
      at: at(),
      source: "appbridge",
      message: {
        type: "session.start",
        callRef,
        appRef: "ivr",
        from: "+15550001111",
        to: "+15550002222"
      }
    },
    ...(opts.recording
      ? [
          {
            at: at(),
            source: "event" as const,
            message: { type: "recording.started", policy: "on" }
          }
        ]
      : []),
    {
      at: at(),
      source: "appbridge",
      message: { type: "turn.ended", text: "I want my balance" }
    },
    {
      at: at(),
      source: "event",
      message: { type: "call.ended", reason: "caller_hangup" }
    }
  ];
  return entries;
}

describe("@callrecord recording, retention and erasure", function () {
  this.timeout(10000);
  let dir: string;
  let working: FsWorkingStore;
  let store: RecordStore;
  let writer: CallRecordWriter;
  let index: RecordIndexEntry[];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-store-"));
    ({ working, store } = fsStores(dir));
    index = [];
    writer = new CallRecordWriter({
      working,
      store,
      key: KEY,
      region: "us-east",
      onSealed: (e) => index.push(e)
    });
  });

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  async function recordedCall(callRef: string) {
    const recorder = new Recorder(writer.recordingDir(callRef));
    const rtp = await recorder.bind();
    // 100 ms of caller audio, then 100 ms of agent audio after a 40 ms gap.
    await send(
      rtp.caller.port,
      [0, 1, 2, 3, 4].map((i) => l16Packet(i, i * 320, 320, 1000))
    );
    await send(
      rtp.agent.port,
      [0, 2, 3, 4, 5, 6].map((i) => l16Packet(i, 5000 + i * 320, 320, -2000))
    );
    await sleep(100);
    recorder.stop();
    for (const e of call(callRef, { recording: true }))
      writer.append(callRef, e);
    writer.close(callRef);
    await writer.flush();
    return (await store.getSealed(callRef))!;
  }

  it("records both sides into one stereo WAV, unmixed", async function () {
    const recorder = new Recorder(path.join(dir, "rec"));
    const rtp = await recorder.bind();
    expect(rtp.caller.codec).to.equal("L16/16000");
    await send(rtp.caller.port, [l16Packet(0, 0, 320, 1000)]);
    await send(rtp.agent.port, [
      l16Packet(0, 100, 320, -2000),
      // a lost packet: 320 samples of silence, then this one
      l16Packet(2, 100 + 640, 320, -2000),
      // a late duplicate is dropped
      l16Packet(1, 100 + 320, 320, 5)
    ]);
    await sleep(100);
    recorder.stop();
    const rec = assembleRecording(path.join(dir, "rec"))!;
    expect(rec.wav.toString("ascii", 0, 4)).to.equal("RIFF");
    expect(rec.wav.readUInt16LE(22)).to.equal(2);
    expect(rec.wav.readUInt32LE(24)).to.equal(16000);
    const [caller, agent] = wavChannels(rec.wav);
    expect(caller.filter((s) => s === 1000).length).to.equal(320);
    expect(agent.filter((s) => s === -2000).length).to.equal(640);
    expect(agent.filter((s) => s === 5).length).to.equal(0);
    expect(caller.some((s) => s === -2000)).to.equal(false);
  });

  it("references the recording with its hash; tampering with it is detected", async function () {
    const sealed = await recordedCall("rec-1");
    const vcon = decodeVcon(sealed.signed);
    const recording = vcon.dialog.find((d) => d.type === "recording")!;
    expect(recording).to.deep.include({
      mimetype: "audio/x-wav",
      url: "parts/recording.wav",
      filename: "recording.wav",
      parties: [0, 2]
    });
    expect(String(recording.content_hash)).to.match(/^sha512-/);
    expect(vcon.fonoster).to.deep.include({
      recording: { policy: "on", consentRequested: false }
    });
    expect((vcon.fonoster as { missing: string[] }).missing).to.deep.equal([]);
    expect(verifyRecord(sealed, KEYS)).to.deep.equal({ ok: true, kid: "k1" });
    expect(index[0].parts).to.deep.equal([
      "recording",
      "transcript",
      "messages"
    ]);

    const wav = sealed.parts.find((p) => p.name === "recording.wav")!;
    const data = Buffer.from(wav.data);
    data[100] ^= 0xff;
    const tampered = {
      ...sealed,
      parts: sealed.parts.map((p) => (p === wav ? { ...p, data } : p))
    };
    expect(verifyRecord(tampered, KEYS)).to.deep.equal({
      ok: false,
      failure: "part recording.wav hash mismatch"
    });
    // The working recording is gone once sealed.
    expect(fs.existsSync(writer.recordingDir("rec-1"))).to.equal(false);
  });

  it("lists the recording as missing when the policy was on but nothing was recorded", async function () {
    for (const e of call("rec-2", { recording: true }))
      writer.append("rec-2", e);
    writer.close("rec-2");
    await writer.flush();
    const vcon = decodeVcon((await store.getSealed("rec-2"))!.signed);
    expect((vcon.fonoster as { missing: string[] }).missing).to.deep.equal([
      "recording"
    ]);
  });

  it("has no recording reference when recording is off", async function () {
    for (const e of call("rec-3")) writer.append("rec-3", e);
    writer.close("rec-3");
    await writer.flush();
    const vcon = decodeVcon((await store.getSealed("rec-3"))!.signed);
    expect(vcon.dialog.some((d) => d.type === "recording")).to.equal(false);
    expect(vcon.fonoster).to.not.have.property("recording");
  });

  it("expires a recording by policy: new version, transcript stays, audit names the policy", async function () {
    await recordedCall("ret-1");
    const { sealed, audit } = await writer.deleteParts("ret-1", ["recording"], {
      reason: "retention policy: recording after 90 days",
      actor: "system:retention"
    });
    expect(sealed.version).to.equal(2);
    expect(await store.getPart("ret-1", "recording.wav")).to.equal(undefined);
    const vcon = decodeVcon(sealed.signed);
    const rec = vcon.dialog.find((d) => d.type === "recording")!;
    expect(rec).to.not.have.property("url");
    expect(
      (rec.meta as { deleted: { reason: string } }).deleted.reason
    ).to.equal("retention policy: recording after 90 days");
    expect(vcon.dialog.some((d) => d.body === "I want my balance")).to.equal(
      true
    );
    // The returned version references stored parts; verify what the store holds.
    expect(
      verifyRecord((await store.getSealed("ret-1"))!, KEYS)
    ).to.deep.include({ ok: true });
    expect(audit).to.deep.equal([
      {
        callRef: "ret-1",
        workspaceRef: "ws-1",
        action: "delete_part",
        part: "recording",
        reason: "retention policy: recording after 90 days",
        actor: "system:retention",
        at: audit[0].at,
        version: 2
      }
    ]);
    expect(index[index.length - 1]).to.deep.include({
      version: 2,
      parts: ["transcript", "messages"]
    });
  });

  it("deleting the transcript also deletes the raw messages, which hold the words (RV-B11)", async function () {
    await recordedCall("ret-3");
    expect(await store.getPart("ret-3", "messages.ndjson")).to.not.equal(
      undefined
    );
    const { sealed, audit } = await writer.deleteParts(
      "ret-3",
      ["transcript"],
      {
        reason: "request",
        actor: "user-1"
      }
    );
    expect(await store.getPart("ret-3", "messages.ndjson")).to.equal(undefined);
    expect(audit.map((a) => a.part)).to.deep.equal(["transcript", "messages"]);
    expect(sealed.parts.map((p) => p.name)).to.not.include("messages.ndjson");
    const v2 = decodeVcon((await store.getSealed("ret-3"))!.signed);
    expect(JSON.stringify(v2)).to.not.include("I want my balance");
    expect(index[index.length - 1].parts).to.not.include("messages");
  });

  it("deleting the transcript removes it from earlier versions too", async function () {
    await recordedCall("ret-2");
    await writer.deleteParts("ret-2", ["transcript", "messages"], {
      reason: "request",
      actor: "user-1"
    });
    const v1 = await store.getVersion("ret-2", 1);
    expect(v1?.signed).to.equal(undefined);
    expect(v1?.manifest.version).to.equal(1);
    const v2 = decodeVcon((await store.getSealed("ret-2"))!.signed);
    expect(v2.dialog.some((d) => d.type === "text")).to.equal(false);
    expect(await store.getPart("ret-2", "messages.ndjson")).to.equal(undefined);
    expect(await store.getPart("ret-2", "recording.wav")).to.not.equal(
      undefined
    );
  });

  it("erases one call: files and contents deleted, a signed tombstone and an audit entry", async function () {
    await recordedCall("erase-1");
    const { audit, version } = await writer.erase("erase-1", {
      reason: "GDPR request #12",
      actor: "user-7"
    });
    expect(version).to.equal(2);
    expect(audit[0]).to.deep.include({
      action: "erase",
      part: "all",
      actor: "user-7",
      reason: "GDPR request #12",
      workspaceRef: "ws-1"
    });
    expect(await store.getVersion("erase-1", 1)).to.equal(undefined);
    expect(await store.getPart("erase-1", "recording.wav")).to.equal(undefined);
    const tomb = (await store.getSealed("erase-1"))!;
    const vcon = decodeVcon(tomb.signed);
    expect(vcon.parties).to.deep.equal([]);
    expect(vcon.fonoster).to.deep.include({ status: "erased" });
    expect(verifyRecord(tomb, KEYS)).to.deep.include({ ok: true });
  });

  it("refuses maintenance that names another workspace (RV-B6)", async function () {
    await recordedCall("ws-check");
    for (const op of [
      () =>
        writer.deleteParts("ws-check", ["recording"], {
          reason: "r",
          actor: "a",
          workspaceRef: "ws-2"
        }),
      () =>
        writer.erase("ws-check", {
          reason: "r",
          actor: "a",
          workspaceRef: "ws-2"
        })
    ]) {
      const e = await op().then(
        () => undefined,
        (err: Error) => err
      );
      expect(e?.name).to.equal("WorkspaceMismatchError");
    }
    expect((await store.getSealed("ws-check"))!.version).to.equal(1);
    expect(await store.getPart("ws-check", "recording.wav")).to.not.equal(
      undefined
    );
  });

  it("seals a minimal record for a call that never reached an app", async function () {
    const entries: RecordEntry[] = [
      {
        at: at(),
        source: "event",
        message: {
          type: "call.started",
          direction: "outbound",
          appRef: "ivr",
          workspaceRef: "ws-1",
          from: "+15550001111",
          to: "+15550003333"
        }
      },
      {
        at: at(),
        source: "event",
        message: { type: "call.failed", reason: "busy", sipStatus: 486 }
      },
      {
        at: at(),
        source: "event",
        message: { type: "call.ended", reason: "error" }
      }
    ];
    for (const e of entries) writer.append("fail-1", e);
    writer.close("fail-1");
    await writer.flush();
    const sealed = (await store.getSealed("fail-1"))!;
    expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
    const vcon = decodeVcon(sealed.signed);
    expect(vcon.parties.map((p) => p.tel ?? p.name)).to.deep.equal([
      "+15550001111",
      "+15550003333",
      "ivr"
    ]);
    expect(vcon.dialog).to.deep.equal([]);
    expect(vcon.fonoster).to.deep.include({
      status: "failed",
      failure: { reason: "busy", sipStatus: 486 }
    });
    expect(index[0]).to.deep.include({
      status: "failed",
      failureReason: "busy",
      sipStatus: 486,
      direction: "outbound"
    });
  });

  it("puts records of a workspace with its own bucket there, and falls back to the region store", async function () {
    const own = fsStores(path.join(dir, "customer")).store;
    const broken = new RecordStore({
      location: "s3://broken/",
      put: async () => {
        throw new Error("unreachable");
      },
      get: async () => undefined,
      delete: async () => false,
      list: async () => []
    } as ObjectStore);
    let target = own;
    const w = new CallRecordWriter({
      working,
      store,
      workspaceStore: (ref) => (ref === "ws-1" ? target : undefined),
      key: KEY,
      region: "us-east",
      onSealed: (e) => index.push(e)
    });
    for (const e of call("own-1")) w.append("own-1", e);
    w.close("own-1");
    await w.flush();
    expect(await own.getVersion("own-1")).to.not.equal(undefined);
    expect(await store.getVersion("own-1")).to.equal(undefined);
    expect(index[0].location).to.equal(own.location);

    target = broken;
    for (const e of call("own-2")) w.append("own-2", e);
    w.close("own-2");
    await w.flush();
    expect(await store.getVersion("own-2")).to.not.equal(undefined);
    expect(index[1].location).to.equal(store.location);
    // RV-B10: maintenance finds the record where the index says it is, not where the workspace's
    // records go now.
    target = own;
    const by = { reason: "r", actor: "a", workspaceRef: "ws-1" };
    const lost = await w.deleteParts("own-2", ["messages"], by).then(
      () => undefined,
      (e: Error) => e
    );
    expect(lost?.message).to.match(/no sealed record/);
    const { sealed } = await w.deleteParts("own-2", ["messages"], {
      ...by,
      location: index[1].location
    });
    expect(sealed.version).to.equal(2);
    expect((await store.getSealed("own-2"))!.version).to.equal(2);
    const erased = await w.erase("own-2", { ...by, location: store.location });
    expect(erased.version).to.equal(3);
    const unknown = await w
      .erase("own-1", { ...by, location: "s3://elsewhere/" })
      .then(
        () => undefined,
        (e: Error) => e
      );
    expect(unknown?.message).to.match(/no record store/);
  });

  it("rebuilds the analytics store from sealed records with the same values", async function () {
    await recordedCall("an-1");
    for (const e of call("an-2")) writer.append("an-2", e);
    writer.close("an-2");
    await writer.flush();
    const sink = new MemoryAnalyticsSink();
    expect(await rebuildAnalytics(store, sink)).to.equal(2);
    const before = JSON.stringify([...sink.rows.values()]);
    expect(sink.rows.get("an-1")).to.deep.include({
      workspaceRef: "ws-1",
      callerTurns: 1,
      hasRecording: true
    });
    await rebuildAnalytics(store, sink);
    expect(JSON.stringify([...sink.rows.values()])).to.equal(before);
  });
});

// Object storage against an S3-compatible server (MinIO): set RECORDS_S3_ENDPOINT,
// RECORDS_S3_ACCESS_KEY and RECORDS_S3_SECRET_KEY; the bucket must exist (RECORDS_S3_BUCKET).
describe("@callrecord S3 object store", function () {
  this.timeout(20000);
  const endpoint = process.env.RECORDS_S3_ENDPOINT;

  before(function () {
    if (!endpoint) this.skip();
  });

  it("stores, lists and deletes sealed records and recordings", async function () {
    const objects = new S3ObjectStore({
      endpoint,
      bucket: process.env.RECORDS_S3_BUCKET ?? "records",
      prefix: `test-${Date.now()}`,
      credentials: {
        accessKeyId: process.env.RECORDS_S3_ACCESS_KEY ?? "",
        secretAccessKey: process.env.RECORDS_S3_SECRET_KEY ?? ""
      }
    });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-s3-"));
    try {
      const store = new RecordStore(objects);
      const writer = new CallRecordWriter({
        working: new FsWorkingStore(dir),
        store,
        key: KEY,
        region: "us-east"
      });
      for (const e of call("s3-1")) writer.append("s3-1", e);
      writer.close("s3-1");
      await writer.flush();
      const sealed = (await store.getSealed("s3-1"))!;
      expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
      expect(await store.listCalls()).to.deep.equal(["s3-1"]);
      expect(objects.location).to.match(/^s3:\/\//);
      await writer.erase("s3-1", { reason: "test", actor: "test" });
      expect(await store.getVersion("s3-1", 1)).to.equal(undefined);
      expect(await objects.get("missing-key")).to.equal(undefined);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
