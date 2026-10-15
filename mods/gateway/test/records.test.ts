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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { NatsConnection, StringCodec, connect } from "nats";
import {
  CallRecordWriter,
  RECORD_SEALED_SUBJECT,
  RecordIndexEntry,
  RecordStore,
  decodeVcon,
  fsStores,
  verifyRecord,
  wavChannels
} from "@fonoster/callrecord";
import { Webhooks } from "@fonoster/common";
import { FakesHarness, Peer } from "@fonoster/conformance";
import {
  AppConfig,
  Gateway,
  GatewayConfig,
  maintenanceSubject,
  recordingPolicy
} from "../src";

// Call records from a running gateway (add-call-record): recording by policy through
// listener.attach, the consent prompt, minimal records, call_record.sealed and the index entry,
// and retention or erasure requests from the control plane. Needs NATS.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sc = StringCodec();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | undefined | false, ms = 5000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

const json = (peer: Peer) =>
  peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256"
});
const KEY = {
  kid: "gw-test",
  privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString()
};
const KEYS = {
  "gw-test": publicKey.export({ type: "spki", format: "pem" }).toString()
};

describe("@gateway call records", function () {
  this.timeout(20000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let gateway: Gateway | undefined;
  let writer: CallRecordWriter;
  let store: RecordStore;
  let dir: string;
  let webhooks: Webhooks.WebhookEvent[];
  let indexed: RecordIndexEntry[];
  let stopIndex: () => void;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gateway-records-"));
    harness = await new FakesHarness().start();
    harness.mediaNode.configure({
      callerAudio: { kind: "tone", ms: 400 }
    });
    harness.mediaNode.attachNats(nc);
    webhooks = [];
    indexed = [];
    const sub = nc.subscribe(RECORD_SEALED_SUBJECT, {
      callback: (_e, msg) => indexed.push(JSON.parse(sc.decode(msg.data)))
    });
    stopIndex = () => sub.unsubscribe();
    const stores = fsStores(dir);
    store = stores.store;
    writer = new CallRecordWriter({
      ...stores,
      key: KEY,
      region: "test-region",
      onSealed: (e) => gateway?.onRecordSealed(e)
    });
  });

  afterEach(async () => {
    stopIndex?.();
    await gateway?.stop();
    gateway = undefined;
    await harness?.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function app(extra: Partial<AppConfig> = {}): AppConfig {
    return {
      ref: "a",
      url: harness.app.url,
      flavor: "native",
      signingSecret: "s",
      workspaceRef: "ws-1",
      speech: { voice: "fake/default", language: "en-US" },
      ...extra
    };
  }

  async function start(
    apps: AppConfig[],
    callRecord: Partial<NonNullable<GatewayConfig["callRecord"]>> = {}
  ) {
    const urls = harness.providerUrls;
    gateway = await new Gateway({
      config: {
        nats: { url: NATS_URL! },
        testMode: true,
        retry: { windowMs: 300, intervalMs: 100 },
        apps,
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        },
        callRecord: {
          dir,
          region: "test-region",
          signingKey: { kid: KEY.kid, privateKeyFile: "unused" },
          recordUrl: "https://api.example.com/api/records",
          ...callRecord
        }
      },
      nats: nc,
      record: writer,
      webhooks: (e) => webhooks.push(e)
    }).start();
  }

  async function sealedRecord(callRef: string) {
    await waitFor(() => indexed.find((e) => e.callRef === callRef), 8000);
    await writer.flush();
    return (await store.getSealed(callRef))!;
  }

  it("resolves the recording policy: app, then workspace, then region default", function () {
    const config = {
      callRecord: {
        recording: "on",
        workspaces: { "ws-2": { recording: "consent" } }
      }
    } as unknown as GatewayConfig;
    expect(recordingPolicy(config, app({ recording: "off" }))).to.equal("off");
    expect(recordingPolicy(config, app({ workspaceRef: "ws-2" }))).to.equal(
      "consent"
    );
    expect(recordingPolicy(config, app())).to.equal("on");
    expect(recordingPolicy({} as GatewayConfig, app())).to.equal("off");
  });

  it("records both sides when the policy is on, and the record references it with its hash", async function () {
    await start([app({ recording: "on" })]);
    const { roomRef } = harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    // The app cannot turn recording off: there is no command for it.
    peer.sendJson({
      type: "speak",
      id: "s1",
      text: "Hello there.",
      last: true
    });
    await waitFor(() => json(peer).find((m) => m.type === "output.done"), 8000);
    const attach = harness.mediaNode.commands.find(
      (c) => c.command.type === "listener.attach"
    )!.command;
    expect((attach.tracks as unknown[]).length).to.equal(2);
    harness.mediaNode.callerHangup(roomRef);

    const sealed = await sealedRecord(roomRef);
    expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
    const vcon = decodeVcon(sealed.signed);
    const rec = vcon.dialog.find((d) => d.type === "recording")!;
    expect(rec).to.deep.include({ url: "parts/recording.wav" });
    const wav = sealed.parts.find((p) => p.name === "recording.wav")!.data;
    const [caller, agent] = wavChannels(wav);
    const loud = (c: Int16Array) => c.filter((s) => Math.abs(s) > 1000).length;
    expect(loud(caller)).to.be.greaterThan(1600); // ≥ 100 ms of the caller's tone
    expect(loud(agent)).to.be.greaterThan(1600); // the agent's speech
    expect(vcon.fonoster).to.deep.include({
      workspaceRef: "ws-1",
      status: "completed"
    });

    const entry = indexed.find((e) => e.callRef === roomRef)!;
    expect(entry).to.deep.include({
      workspaceRef: "ws-1",
      appRef: "a",
      region: "test-region",
      version: 1
    });
    expect(entry.parts).to.include("recording");
    const sealedHook = webhooks.find((w) => w.type === "call_record.sealed")!;
    expect(sealedHook.workspaceRef).to.equal("ws-1");
    expect(sealedHook.data).to.deep.equal({
      callRef: roomRef,
      version: 1,
      recordUrl: `https://api.example.com/api/records/${roomRef}?version=1`
    });
    expect(JSON.stringify(sealedHook)).to.not.contain("Hello there");
  });

  it("makes no recording when the policy is off", async function () {
    await start([app()]);
    const { roomRef } = harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    harness.mediaNode.callerHangup(roomRef);
    const vcon = decodeVcon((await sealedRecord(roomRef)).signed);
    expect(vcon.dialog.some((d) => d.type === "recording")).to.equal(false);
    expect(
      harness.mediaNode.commands.some(
        (c) => c.command.type === "listener.attach"
      )
    ).to.equal(false);
  });

  it("plays the consent prompt before recording starts and notes it in the record", async function () {
    await start([app({ recording: "consent" })], {
      consentPrompt: "This call is recorded for quality."
    });
    const since = Date.now();
    const { roomRef } = harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(
      () => json(peer).find((m) => m.type === "session.start"),
      8000
    );
    // The prompt played before the app's session started.
    expect(harness.mediaNode.outputAudioMs(since)).to.be.greaterThan(200);
    const types = harness.mediaNode.commands.map((c) => c.command.type);
    expect(types.indexOf("answer")).to.be.lessThan(
      types.indexOf("listener.attach")
    );
    harness.mediaNode.callerHangup(roomRef);
    const vcon = decodeVcon((await sealedRecord(roomRef)).signed);
    expect(vcon.fonoster).to.deep.include({
      recording: { policy: "consent", consentRequested: true }
    });
  });

  it("seals a minimal record with call.failed for a call with no app", async function () {
    await start([app({ numbers: ["+1999"] })]);
    const { roomRef } = harness.mediaNode.offerCall({
      appRef: "missing",
      to: "+15550009999"
    } as never);
    const sealed = await sealedRecord(roomRef);
    expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
    const vcon = decodeVcon(sealed.signed);
    expect(vcon.fonoster).to.deep.include({
      status: "failed",
      failure: { reason: "no_app" }
    });
    expect(vcon.dialog).to.deep.equal([]);
    expect(webhooks.map((w) => w.type)).to.include.members([
      "call.failed",
      "call_record.sealed"
    ]);
  });

  it("deletes parts and erases records on request from the control plane", async function () {
    await start([app({ recording: "on" })]);
    const { roomRef } = harness.mediaNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    await sleep(300);
    harness.mediaNode.callerHangup(roomRef);
    await sealedRecord(roomRef);

    const request = async (body: Record<string, unknown>) =>
      JSON.parse(
        sc.decode(
          (
            await nc.request(
              maintenanceSubject("test-region"),
              sc.encode(JSON.stringify(body)),
              { timeout: 5000 }
            )
          ).data
        )
      );
    const deleted = await request({
      op: "delete_parts",
      callRef: roomRef,
      parts: ["recording"],
      reason: "retention policy: recording after 90 days",
      actor: "system:retention"
    });
    expect(deleted).to.deep.include({ type: "ack", version: 2 });
    expect(deleted.audit[0]).to.deep.include({
      part: "recording",
      workspaceRef: "ws-1"
    });
    expect(await store.getPart(roomRef, "recording.wav")).to.equal(undefined);

    const erased = await request({
      op: "erase",
      callRef: roomRef,
      reason: "erasure request",
      actor: "user-1"
    });
    expect(erased).to.deep.include({ type: "ack", version: 3 });
    expect(await store.getVersion(roomRef, 1)).to.equal(undefined);
    // erasure is indexed (status erased) but sends no call_record.sealed
    await waitFor(() =>
      indexed.find((e) => e.callRef === roomRef && e.status === "erased")
    );
    expect(
      webhooks.filter((w) => w.type === "call_record.sealed").length
    ).to.equal(2);

    expect(
      await request({ op: "erase", callRef: "nope", reason: "x", actor: "y" })
    ).to.deep.include({ type: "error", code: "not_found" });
  });
});
