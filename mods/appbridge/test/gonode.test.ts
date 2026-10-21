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
import {
  buildRoomr,
  loadScenarios,
  RoomrBinaries,
  RealMediaHarness,
  runScenario,
  Scenario
} from "@fonoster/conformance";
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  CallRecordWriter,
  RecordIndexEntry,
  decodeVcon,
  fsStores,
  wavChannels
} from "@fonoster/callrecord";
import { expect } from "chai";
import { Webhooks } from "@fonoster/common";
import { connect, NatsConnection } from "nats";
import { AppBridgeConfig } from "../src/config";
import { AppBridge } from "../src/AppBridge";
import { MemoryCallRecordSink } from "../src/record/CallRecordSink";
import { catalogFor } from "./scenarioCatalog";
import { appsFor, recordReaders } from "./scenarioApps";

// The voice-session suite through AppBridge, the Go Roomr node and a SIP caller bot: real SIP,
// RTP and the per-call control stream end to end (add-roomr 3.x, redesign-roomr 5.3). Needs NATS
// (CONFORMANCE_NATS_URL) and a Go toolchain.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

// Node features not built yet, and assertions only the fake node can make.
const NOT_YET: Record<string, string> = {
  "caller-audio-to-stt":
    "times the caller's packets from the fake node's send log (the real node keeps none)",
  "media-timeout-ends-session":
    "drop is a fake-node action (the real timeout is 15 s)",
  "outbound-answered":
    "outbound calls need a callee bot answering the node's INVITE (not in the real-media harness)",
  "outbound-busy":
    "outbound calls need a callee bot answering the node's INVITE (not in the real-media harness)"
};

function configFor(
  scenario: Scenario,
  harness: RealMediaHarness
): AppBridgeConfig {
  const urls = harness.providerUrls;
  return {
    nats: { url: NATS_URL! },
    session: { listen: "127.0.0.1:0" },
    retry: { windowMs: 600, intervalMs: 100 },
    apps: appsFor(scenario, harness, "fonoster"),
    providers: {
      fake: {
        adapter: "fake",
        capabilities: ["tts", "stt"],
        tts: { url: urls.tts, timeoutMs: 1500 },
        stt: { url: urls.stt }
      }
    }
  };
}

describe("@appbridge voice-session through the Go Roomr node", function () {
  // The scenarios play media from the harness's local server; play fetches reach public
  // addresses only unless allowed (M13).
  let allowedDestinations: string | undefined;
  before(function () {
    allowedDestinations = process.env.FONOSTER_ALLOWED_DESTINATIONS;
    process.env.FONOSTER_ALLOWED_DESTINATIONS = "127.0.0.1";
  });
  after(function () {
    if (allowedDestinations === undefined)
      delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
    else process.env.FONOSTER_ALLOWED_DESTINATIONS = allowedDestinations;
  });
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: RoomrBinaries | undefined;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    bins = buildRoomr(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async function () {
    await nc?.close();
  });

  const scenarios: Scenario[] = loadScenarios("voice-session");
  for (const scenario of scenarios) {
    it(scenario.name, async function () {
      if (NOT_YET[scenario.name]) return this.skip();
      const record = new MemoryCallRecordSink();
      const webhooks: Webhooks.WebhookEvent[] = [];
      const harness = await new RealMediaHarness(nc, bins!, {
        vendorCalls: () => 0,
        ...recordReaders(record),
        webhookEvents: () => webhooks.map((e) => ({ type: e.type, ...e.data }))
      }).start();
      const appbridge = await new AppBridge({
        tap: harness.tap,
        config: configFor(scenario, harness),
        registryStore: catalogFor(scenario),
        nats: nc,
        record,
        webhooks: (e) => webhooks.push(e)
      }).start();
      // The node opens each call's control stream to this AppBridge.
      harness.sessionEndpoint = appbridge.sessionEndpoint;
      try {
        const result = await runScenario(scenario, {
          harness,
          connect: () => harness.offerCallAndAccept()
        });
        expect(result.status, result.reason).to.equal("passed");
      } finally {
        await appbridge.stop();
        await harness.stop();
      }
    });
  }
});

// Recording policy through the real node's AttachListener (add-call-record 3.2): one unmixed RTP
// stream per side, written by AppBridge's recorder and sealed into the record.
describe("@AppBridge call recording through the Go Roomr node", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: RoomrBinaries | undefined;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    bins = buildRoomr(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  it("records both sides of a real call into the sealed record", async function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gonode-recording-"));
    const sealed: RecordIndexEntry[] = [];
    const stores = fsStores(dir);
    const writer = new CallRecordWriter({
      ...stores,
      region: "test",
      key: {
        kid: "k",
        privateKeyPem: generateKeyPairSync("ec", { namedCurve: "P-256" })
          .privateKey.export({ type: "pkcs8", format: "pem" })
          .toString()
      },
      onSealed: (e) => sealed.push(e)
    });
    const harness = await new RealMediaHarness(nc, bins!, {
      vendorCalls: () => 0
    }).start();
    const config = configFor({ name: "recording" } as Scenario, harness);
    config.apps[0].recording = "on";
    const appbridge = await new AppBridge({
      tap: harness.tap,
      config: {
        ...config,
        callRecord: {
          dir,
          region: "test",
          signingKey: { kid: "k", privateKeyFile: "unused" }
        }
      },
      nats: nc,
      record: writer
    }).start();
    // The node opens each call's control stream to this AppBridge.
    harness.sessionEndpoint = appbridge.sessionEndpoint;
    try {
      const peer = await harness.offerCallAndAccept();
      await harness.caller({ audio: { kind: "tone", ms: 600 } });
      peer.sendJson({
        type: "speak",
        id: "s1",
        text: "Hello from the agent.",
        last: true
      });
      const deadline = Date.now() + 8000;
      while (
        !peer.frames.items.some(
          (f) =>
            f.kind === "json" &&
            (f.data as { type: string }).type === "output.done"
        )
      ) {
        if (Date.now() > deadline) throw new Error("no output.done");
        await new Promise((r) => setTimeout(r, 20));
      }
      await harness.caller({ hangup: true });
      while (!sealed.length) {
        if (Date.now() > deadline + 5000) throw new Error("not sealed");
        await new Promise((r) => setTimeout(r, 20));
      }
      const record = (await stores.store.getSealed(sealed[0].callRef))!;
      const vcon = decodeVcon(record.signed);
      expect(vcon.dialog.some((d) => d.type === "recording")).to.equal(true);
      const wav = record.parts.find((p) => p.name === "recording.wav")!.data;
      const [caller, agent] = wavChannels(wav);
      const loud = (c: Int16Array) =>
        c.filter((x) => Math.abs(x) > 1000).length;
      expect(loud(caller)).to.be.greaterThan(1600);
      expect(loud(agent)).to.be.greaterThan(1600);
    } finally {
      await appbridge.stop();
      await harness.stop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Every SIP codec the node negotiates reaches the app in the app's format (AO-B4): AppBridge leg
// stays L16/16000 and the Roomr node transcodes PCMU, PCMA, G.722 and Opus.
describe("@appbridge SIP codecs through the Go Roomr node", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: RoomrBinaries | undefined;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    bins = buildRoomr(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  for (const codec of ["PCMU/8000", "PCMA/8000", "G722/8000", "opus/48000"]) {
    it(`a ${codec} caller and a pcm16 app hear each other`, async function () {
      const harness = await new RealMediaHarness(nc, bins!, {
        vendorCalls: () => 0
      }).start();
      const appbridge = await new AppBridge({
        tap: harness.tap,
        config: configFor({ name: codec } as Scenario, harness),
        nats: nc,
        record: new MemoryCallRecordSink()
      }).start();
      // The node opens each call's control stream to this AppBridge.
      harness.sessionEndpoint = appbridge.sessionEndpoint;
      try {
        let peer;
        try {
          peer = await harness.offerCallAndAccept(5000, { codecs: [codec] });
        } catch (e) {
          // A node built without libopus refuses an Opus-only offer.
          if (codec.startsWith("opus")) return this.skip();
          throw e;
        }
        expect((await harness.media.status()).codec).to.equal(codec);
        // AppBridge's leg stays L16/16000 whatever the caller's codec (its Answer's media).
        const commands = (await harness.measure("media.commands", 0)) as {
          type: string;
          media?: { codec?: string };
        }[];
        const answer = commands.find((c) => c.type === "answer");
        expect(answer?.media?.codec).to.equal("L16/16000");

        const before = peer.frames.items.length;
        await harness.caller({ audio: { kind: "tone", ms: 600 } });
        const deadline = Date.now() + 5000;
        const loudFrames = () =>
          peer!.frames.items.slice(before).filter((f) => {
            if (f.kind !== "binary") return false;
            const b = f.data as Buffer;
            for (let i = 1; i + 1 < b.length; i += 2)
              if (Math.abs(b.readInt16LE(i)) > 1000) return true;
            return false;
          }).length;
        while (loudFrames() < 15) {
          if (Date.now() > deadline) throw new Error("no caller tone");
          await new Promise((r) => setTimeout(r, 20));
        }

        const since = Date.now();
        peer.sendJson({ type: "speak", id: "s1", text: "Hello.", last: true });
        while ((await harness.media.status(since)).audibleMsSince < 300) {
          if (Date.now() > deadline + 5000)
            throw new Error("the caller heard nothing");
          await new Promise((r) => setTimeout(r, 50));
        }
      } finally {
        await appbridge.stop();
        await harness.stop();
      }
    });
  }
});

// NATS carries everything internal except audio (control-plane spec, "No audio on the bus";
// harden-conformance 1.2): a real call with audio both ways runs through the node while a
// subscriber on `>` sees every message on the bus. Audio would show up as binary payloads (PCM or
// RTP is not text) or as one subject at a media frame rate (50/s for 20 ms frames). Every message
// must be text, and no subject may pass 10/s. The spec's call lasts 60 s; this one carries a few
// seconds each way, which is enough to see a stream at frame rate.
describe("@appbridge no audio on the bus (Go Roomr node)", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: RoomrBinaries | undefined;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    bins = buildRoomr(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  it("no NATS message carries audio while a call has audio both ways", async function () {
    const bus = await connect({ servers: NATS_URL!, name: "bus-observer" });
    const text = new TextDecoder("utf-8", { fatal: true });
    const counts = new Map<string, number>();
    const binary: string[] = [];
    const observer = bus.subscribe(">", {
      callback: (_e, msg) => {
        counts.set(msg.subject, (counts.get(msg.subject) ?? 0) + 1);
        if (!msg.data.length) return;
        try {
          // eslint-disable-next-line no-control-regex
          if (/[\x00-\x08]/.test(text.decode(msg.data)))
            binary.push(msg.subject);
        } catch {
          binary.push(msg.subject);
        }
      }
    });
    await bus.flush();
    const harness = await new RealMediaHarness(nc, bins!, {
      vendorCalls: () => 0
    }).start();
    const appbridge = await new AppBridge({
      tap: harness.tap,
      config: configFor({ name: "no-audio-on-bus" } as Scenario, harness),
      nats: nc,
      record: new MemoryCallRecordSink()
    }).start();
    // The node opens each call's control stream to this AppBridge.
    harness.sessionEndpoint = appbridge.sessionEndpoint;
    const started = Date.now();
    try {
      const peer = await harness.offerCallAndAccept();
      // Caller to app.
      const before = peer.frames.items.length;
      await harness.caller({ audio: { kind: "tone", ms: 3000 } });
      const loudFrames = () =>
        peer.frames.items.slice(before).filter((f) => {
          if (f.kind !== "binary") return false;
          const b = f.data as Buffer;
          for (let i = 1; i + 1 < b.length; i += 2)
            if (Math.abs(b.readInt16LE(i)) > 1000) return true;
          return false;
        }).length;
      const deadline = Date.now() + 8000;
      while (loudFrames() < 100) {
        if (Date.now() > deadline) throw new Error("no caller tone");
        await new Promise((r) => setTimeout(r, 20));
      }
      // App to caller.
      const since = Date.now();
      peer.sendJson({
        type: "speak",
        id: "s1",
        text: "Hello from the agent, this is a longer sentence.",
        last: true
      });
      while ((await harness.media.status(since)).audibleMsSince < 1000) {
        if (Date.now() > deadline + 5000)
          throw new Error("the caller heard nothing");
        await new Promise((r) => setTimeout(r, 50));
      }
      await harness.caller({ hangup: true });
      await bus.flush();

      const seconds = Math.max(1, (Date.now() - started) / 1000);
      expect(binary, "binary payloads on the bus").to.deep.equal([]);
      const busiest = [...counts].sort((x, y) => y[1] - x[1])[0];
      expect(counts.size, "the observer saw the call's messages").to.be.above(
        0
      );
      expect(
        busiest[1] / seconds,
        `${busiest[0]}: ${busiest[1]} messages in ${seconds.toFixed(1)} s`
      ).to.be.below(10);
    } finally {
      observer.unsubscribe();
      await appbridge.stop();
      await harness.stop();
      await bus.close();
    }
  });
});
