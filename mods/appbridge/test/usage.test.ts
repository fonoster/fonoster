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
import { createSign, generateKeyPairSync } from "crypto";
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
  verifyRecord
} from "@fonoster/callrecord";
import { FakesHarness, Peer } from "@fonoster/conformance";
import { z } from "zod";
import { AppConfig, AppBridge } from "../src";
import { AudioFilterFactory } from "../src/filters";

// Two test noise-cancelling filters, each on a keyed fake provider: one passes audio through,
// the other breaks after a few frames, so its slot fails open and stops counting.
let boomFrames = 0;
AudioFilterFactory.registerFilter("test-nc", {
  description: "pass-through noise cancelling for tests",
  optionsSchema: z.object({}),
  publicOptionsSchema: z.object({}),
  provider: "fakenc",
  create: () => ({ name: "test-nc", delayMs: 0, process: (f: Int16Array) => f })
});
AudioFilterFactory.registerFilter("test-nc-boom", {
  description: "noise cancelling that breaks after five frames",
  optionsSchema: z.object({}),
  publicOptionsSchema: z.object({}),
  provider: "fakenc2",
  create: () => ({
    name: "test-nc-boom",
    delayMs: 0,
    process: (f: Int16Array) => {
      if (++boomFrames > 5) throw new Error("kaput");
      return f;
    }
  })
});

// Usage metering on a running AppBridge (add-usage-metering, group 3): what a call consumes is
// counted where the work happens and sealed with the call record. Needs NATS.
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

const IDENTITY = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" }
});

/** A browser test call's connect token for workspace ws-1 (add-talk-in-browser D4). */
function testToken() {
  const enc = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iat: now,
    exp: now + 3600,
    accessKeyId: "ws-1",
    allowedMethods: ["INVITE"]
  })}`;
  const s = createSign("RSA-SHA256");
  s.update(body);
  return `${body}.${s.sign(IDENTITY.privateKey).toString("base64url")}`;
}

type Line = {
  meter: string;
  quantity: number;
  provider?: string;
  model?: string;
  keySource?: string;
};
const lineOf = (lines: Line[] | undefined, meter: string) =>
  lines?.find((l) => l.meter === meter);

describe("@AppBridge usage metering", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let writer: CallRecordWriter;
  let store: RecordStore;
  let dir: string;
  let indexed: RecordIndexEntry[];
  let stopIndex: () => void;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "appbridge-usage-"));
    fs.writeFileSync(path.join(dir, "identity.pem"), IDENTITY.publicKey);
    harness = await new FakesHarness().start();
    harness.roomrNode.configure({ callerAudio: { kind: "tone", ms: 400 } });
    harness.roomrNode.attachNats(nc);
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
      onSealed: (e) => appbridge?.onRecordSealed(e)
    });
  });

  afterEach(async () => {
    stopIndex?.();
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function app(extra: Partial<AppConfig> = {}): AppConfig {
    return {
      ref: "a",
      url: harness.app.url,
      protocol: "fonoster",
      signingSecret: "s",
      workspaceRef: "ws-1",
      speech: { voice: "fake/default", language: "en-US" },
      ...extra
    };
  }

  async function start(apps: AppConfig[], keyedWorkspace?: string) {
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      config: {
        nats: { url: NATS_URL! },
        retry: { windowMs: 300, intervalMs: 100 },
        apps,
        providers: {
          fakenc: {
            adapter: "fake",
            capabilities: ["nc"],
            keyless: false,
            credential: { value: "nc-key" }
          },
          fakenc2: {
            adapter: "fake",
            capabilities: ["nc"],
            keyless: false,
            credential: { value: "nc-key" }
          },
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            // Keyed for the key-source test: a keyless provider never uses a workspace key.
            ...(keyedWorkspace ? { keyless: false } : {}),
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        },
        testCalls: { publicKeyFile: path.join(dir, "identity.pem") },
        callRecord: {
          dir,
          region: "test-region",
          signingKey: { kid: KEY.kid, privateKeyFile: "unused" },
          recordUrl: "https://api.example.com/api/records"
        }
      },
      nats: nc,
      record: writer,
      workspaceKeys: keyedWorkspace
        ? {
            get: async (ws: string, provider: string) =>
              ws === keyedWorkspace && provider === "fake"
                ? "own-key"
                : undefined
          }
        : undefined
    }).start();
  }

  async function sealed(callRef: string) {
    const entry = await waitFor(
      () => indexed.find((e) => e.callRef === callRef),
      10000
    );
    await writer.flush();
    const record = (await store.getSealed(callRef))!;
    return { entry, record, vcon: decodeVcon(record.signed) };
  }

  /** Answers a call, has the app speak, waits, then the caller hangs up. */
  async function talk(text: string, holdMs: number) {
    const { roomRef } = harness.roomrNode.offerCall();
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    peer.sendJson({ type: "speak", id: "s1", text, last: true });
    await waitFor(() => json(peer).find((m) => m.type === "output.done"), 8000);
    await sleep(holdMs);
    return { roomRef, peer };
  }

  it("[BIL-001] seals a call's usage, signed, in the record and its index entry", async () => {
    await start([app({ recording: "on" })]);
    const { roomRef } = await talk("Hello there.", 1600);
    harness.roomrNode.callerHangup(roomRef);
    const { entry, record, vcon } = await sealed(roomRef);
    expect(verifyRecord(record, KEYS)).to.deep.include({ ok: true });
    const lines = (vcon.fonoster as { usage?: Line[] }).usage;
    expect(lineOf(lines, "tts.characters")).to.deep.equal({
      meter: "tts.characters",
      quantity: 12,
      provider: "fake",
      model: "fake/default",
      keySource: "platform"
    });
    expect(lineOf(lines, "stt.seconds")).to.deep.include({
      provider: "fake",
      keySource: "platform"
    });
    expect(lineOf(lines, "stt.seconds")!.quantity).to.be.at.least(1);
    expect(lineOf(lines, "call.seconds")!.quantity).to.be.at.least(2);
    expect(lineOf(lines, "recording.seconds")!.quantity).to.be.at.least(2);
    expect(lineOf(lines, "recording.seconds")).to.not.have.property(
      "keySource"
    );
    expect(entry.usage).to.deep.equal(lines);
    expect(entry.origin).to.equal("call");
  });

  it("[BIL-005] says keySource workspace when the workspace has its own key for the vendor", async () => {
    await start([app({ workspaceRef: "ws-keyed" })], "ws-keyed");
    const { roomRef } = await talk("Hi.", 0);
    harness.roomrNode.callerHangup(roomRef);
    const { vcon } = await sealed(roomRef);
    expect(
      lineOf((vcon.fonoster as { usage?: Line[] }).usage, "tts.characters")
    ).to.deep.include({
      quantity: 3,
      keySource: "workspace"
    });
  });

  it("[BIL-009] adds an Autopilot agent's usage.report to the call", async () => {
    await start([app({ type: "AUTOPILOT" })]);
    const { roomRef, peer } = await talk("Hi.", 0);
    peer.sendJson({
      type: "usage.report",
      lines: [
        {
          meter: "llm.tokens.in",
          quantity: 1200,
          provider: "openai",
          model: "openai/gpt-4o-mini",
          keySource: "platform"
        },
        {
          meter: "llm.tokens.out",
          quantity: 340,
          provider: "openai",
          model: "openai/gpt-4o-mini",
          keySource: "platform"
        }
      ]
    });
    peer.sendJson({
      type: "usage.report",
      lines: [
        {
          meter: "llm.tokens.in",
          quantity: 300,
          provider: "openai",
          model: "openai/gpt-4o-mini",
          keySource: "platform"
        }
      ]
    });
    await sleep(200);
    expect(json(peer).filter((m) => m.type === "error")).to.deep.equal([]);
    harness.roomrNode.callerHangup(roomRef);
    const { vcon } = await sealed(roomRef);
    const lines = (vcon.fonoster as { usage?: Line[] }).usage;
    expect(lineOf(lines, "llm.tokens.in")!.quantity).to.equal(1500);
    expect(lineOf(lines, "llm.tokens.out")!.quantity).to.equal(340);
  });

  it("[BIL-009] refuses usage.report from an app that is not an Autopilot agent", async () => {
    await start([app({ type: "STREAM" })]);
    const { roomRef, peer } = await talk("Hi.", 0);
    peer.sendJson({
      type: "usage.report",
      id: "u1",
      lines: [
        {
          meter: "llm.tokens.in",
          quantity: 10,
          provider: "openai",
          keySource: "platform"
        }
      ]
    });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error" && m.relatesTo === "u1")
    );
    expect(error.code).to.equal("bad_message");
    harness.roomrNode.callerHangup(roomRef);
    const { vcon } = await sealed(roomRef);
    expect(
      lineOf((vcon.fonoster as { usage?: Line[] }).usage, "llm.tokens.in")
    ).to.equal(undefined);
  });

  it("[BIL-009] refuses usage.report for a meter Autopilot does not report", async () => {
    await start([app({ type: "AUTOPILOT" })]);
    const { roomRef, peer } = await talk("Hi.", 0);
    peer.sendJson({
      type: "usage.report",
      id: "u2",
      lines: [
        {
          meter: "call.seconds",
          quantity: 999,
          provider: "x",
          keySource: "platform"
        }
      ]
    });
    const error = await waitFor(() =>
      json(peer).find((m) => m.type === "error" && m.relatesTo === "u2")
    );
    expect(error.code).to.equal("bad_message");
    harness.roomrNode.callerHangup(roomRef);
    const { vcon } = await sealed(roomRef);
    expect(
      lineOf((vcon.fonoster as { usage?: Line[] }).usage, "call.seconds")
        ?.quantity ?? 0
    ).to.be.below(999);
  });

  it("[BIL-006] seals no usage for a call that never reached an app", async () => {
    await start([]);
    const { roomRef } = harness.roomrNode.offerCall();
    const { entry, vcon } = await sealed(roomRef);
    expect(entry.usage).to.equal(undefined);
    expect(vcon.fonoster).to.not.have.property("usage");
  });

  it("[BIL-007] marks a browser test call's usage with origin browser_test", async () => {
    await start([app()]);
    const { roomRef } = harness.roomrNode.offerCall({
      appRef: "a",
      headers: { "X-Connect-Token": testToken(), "X-App-Ref": "a" }
    });
    const { peer } = await harness.app.nextConnection();
    await waitFor(() => json(peer).find((m) => m.type === "session.start"));
    await sleep(1200);
    harness.roomrNode.callerHangup(roomRef);
    const { entry, vcon } = await sealed(roomRef);
    expect(entry.origin).to.equal("browser_test");
    expect(vcon.fonoster).to.deep.include({ origin: "browser_test" });
    expect(
      lineOf(entry.usage as Line[], "call.seconds")!.quantity
    ).to.be.at.least(1);
  });

  it("[BIL-005] meters noise cancelling per filter vendor and stops counting a filter that failed", async () => {
    boomFrames = 0;
    await start([
      app({ filters: [{ name: "test-nc" }, { name: "test-nc-boom" }] })
    ]);
    const { roomRef } = await talk("Hello there.", 2000);
    harness.roomrNode.callerHangup(roomRef);
    const { vcon } = await sealed(roomRef);
    const lines = (vcon.fonoster as { usage?: Line[] }).usage ?? [];
    const nc = lines.filter((l) => l.meter === "nc.seconds");
    const healthy = nc.find((l) => l.provider === "fakenc");
    const broken = nc.find((l) => l.provider === "fakenc2");
    expect(healthy).to.deep.include({ keySource: "platform" });
    expect(healthy!.quantity).to.be.at.least(2);
    expect(broken!.quantity).to.equal(1);
    expect(
      (vcon.fonoster as { filters?: { failed: unknown[] } }).filters?.failed
    ).to.have.length(1);
  });
});
