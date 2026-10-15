/*
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
import {
  CallRecordWriter,
  FsObjectStore,
  FsWorkingStore,
  ObjectStore,
  RecordEntry,
  RecordStore,
  S3ObjectStore,
  assembleRecording,
  assembleRecordingFile,
  contentHash,
  decodeVcon,
  verifyRecord
} from "../src";

// Recordings are streamed at seal (LO-B7): the stereo WAV is written to disk chunk by chunk,
// hashed on the way and uploaded from the file; new versions never download it again.

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

/** Writes recorder output directly: a ramp per side, with different lengths. */
function writeTracks(dir: string, callerSamples: number, agentSamples: number) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "meta.json"),
    JSON.stringify({
      startedAt: 1_700_000_000_000,
      rate: 16000,
      sides: ["caller", "agent"]
    })
  );
  const pcm = (n: number, k: number) => {
    const b = Buffer.alloc(n * 2);
    for (let i = 0; i < n; i++)
      b.writeInt16LE(((i * k) % 30000) - 15000, i * 2);
    return b;
  };
  fs.writeFileSync(path.join(dir, "caller.pcm"), pcm(callerSamples, 7));
  fs.writeFileSync(path.join(dir, "agent.pcm"), pcm(agentSamples, 3));
}

function entries(callRef: string): RecordEntry[] {
  let t = 1_700_000_000_000;
  const at = () => (t += 100);
  return [
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
      source: "gateway",
      message: { type: "session.start", callRef, appRef: "ivr" }
    },
    {
      at: at(),
      source: "event",
      message: { type: "recording.started", policy: "on" }
    },
    {
      at: at(),
      source: "event",
      message: { type: "call.ended", reason: "caller_hangup" }
    }
  ];
}

/** Counts whole-object reads, to prove new versions do not download parts. */
function counting(objects: ObjectStore) {
  const reads: string[] = [];
  const wrapped: ObjectStore = {
    location: objects.location,
    put: (k, d, t) => objects.put(k, d, t),
    putFile: objects.putFile?.bind(objects),
    has: objects.has?.bind(objects),
    get: (k) => {
      reads.push(k);
      return objects.get(k);
    },
    delete: (k) => objects.delete(k),
    list: (p) => objects.list(p)
  };
  return { wrapped, reads };
}

async function sealRecorded(
  objects: ObjectStore,
  dir: string,
  callRef: string
) {
  const { wrapped, reads } = counting(objects);
  const store = new RecordStore(wrapped);
  const writer = new CallRecordWriter({
    working: new FsWorkingStore(dir),
    store,
    key: KEY,
    region: "us-east"
  });
  // 150 000 caller samples and 90 000 agent samples: more than two streaming chunks.
  writeTracks(writer.recordingDir(callRef), 150_000, 90_000);
  for (const e of entries(callRef)) writer.append(callRef, e);
  writer.close(callRef);
  await writer.flush();
  return { store, writer, reads };
}

describe("@callrecord streamed recordings", function () {
  this.timeout(20000);
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "callrecord-stream-"));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("streams the same WAV the in-memory assembly builds, with its hash", function () {
    const rec = path.join(dir, "rec");
    writeTracks(rec, 150_000, 90_001);
    const memory = assembleRecording(rec)!;
    const out = assembleRecordingFile(rec, path.join(dir, "out.wav"))!;
    const streamed = fs.readFileSync(out.file);
    expect(streamed.equals(memory.wav)).to.equal(true);
    expect(out.size).to.equal(memory.wav.length);
    expect(out.content_hash).to.equal(contentHash(memory.wav));
    expect(out.durationMs).to.equal(memory.durationMs);
    expect(assembleRecordingFile(path.join(dir, "none"), "x.wav")).to.equal(
      undefined
    );
  });

  it("seals from the streamed file, and new versions reuse the stored recording", async function () {
    const objects = new FsObjectStore(path.join(dir, "sealed"));
    const { store, writer, reads } = await sealRecorded(objects, dir, "big-1");
    const sealed = (await store.getSealed("big-1"))!;
    expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
    const wav = sealed.parts.find((p) => p.name === "recording.wav")!.data;
    expect(wav.length).to.equal(44 + 150_000 * 4);
    // the working copy (tracks and streamed WAV) is gone once stored
    expect(fs.existsSync(writer.recordingDir("big-1"))).to.equal(false);

    reads.length = 0;
    await writer.addVersion("big-1", {
      analysis: [{ type: "summary", vendor: "fonoster", body: "x" }]
    });
    expect(reads.filter((k) => k.endsWith("recording.wav"))).to.deep.equal([]);
    const v2 = (await store.getSealed("big-1"))!;
    expect(v2.version).to.equal(2);
    expect(verifyRecord(v2, KEYS)).to.deep.include({ ok: true });
    expect(
      decodeVcon(v2.signed).dialog.find((d) => d.type === "recording")
    ).to.deep.include({ url: "parts/recording.wav" });
  });

  it("streams the recording into S3-compatible storage (MinIO)", async function () {
    const endpoint = process.env.RECORDS_S3_ENDPOINT;
    if (!endpoint) this.skip();
    const objects = new S3ObjectStore({
      endpoint,
      bucket: process.env.RECORDS_S3_BUCKET ?? "records",
      prefix: `stream-${Date.now()}`,
      credentials: {
        accessKeyId: process.env.RECORDS_S3_ACCESS_KEY ?? "",
        secretAccessKey: process.env.RECORDS_S3_SECRET_KEY ?? ""
      }
    });
    const { store, writer } = await sealRecorded(objects, dir, "s3-big");
    expect(await objects.has("s3-big/parts/recording.wav")).to.equal(true);
    expect(await objects.has("s3-big/parts/nope.wav")).to.equal(false);
    const sealed = (await store.getSealed("s3-big"))!;
    expect(verifyRecord(sealed, KEYS)).to.deep.include({ ok: true });
    await writer.erase("s3-big", { reason: "test", actor: "test" });
    expect(await objects.has("s3-big/parts/recording.wav")).to.equal(false);
  });
});
