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
  buildMediaNode,
  loadScenarios,
  MediaNodeBinaries,
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
import { connect, NatsConnection } from "nats";
import { GatewayConfig } from "../src/config";
import { Gateway } from "../src/Gateway";
import { MemoryCallRecordSink } from "../src/record/CallRecordSink";
import { catalogFor } from "./scenarioCatalog";

// The voice-session suite through the gateway, the Go media node and a SIP caller bot: real SIP,
// RTP and media-control end to end (add-media-node 3.x, the first-call milestone). Needs NATS
// (CONFORMANCE_NATS_URL) and a Go toolchain.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const SECRET = "conformance-secret";

// Node features not built yet, and assertions only the fake node can make.
const NOT_YET: Record<string, string> = {
  "media-timeout-ends-session":
    "drop is a fake-node action (the real timeout is 30 s)"
};

function configFor(
  scenario: Scenario,
  harness: RealMediaHarness
): GatewayConfig {
  const urls = harness.providerUrls;
  return {
    nats: { url: NATS_URL! },
    testMode: true,
    retry: { windowMs: 600, intervalMs: 100 },
    apps: [
      {
        ref: "app-1",
        url: harness.app.url,
        flavor: "native",
        signingSecret: scenario.setup?.app?.signingSecret ?? SECRET,
        speech: { voice: "fake/default", language: "en-US" }
      }
    ],
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

describe("@gateway voice-session through the Go media node", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: MediaNodeBinaries | undefined;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    bins = buildMediaNode(NATS_URL);
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
      const harness = await new RealMediaHarness(nc, bins!, {
        vendorCalls: () => 0,
        recordEvents: (type) =>
          [...record.records.values()]
            .flat()
            .filter((e) => e.source === "event" && e.message.type === type)
            .map((e) => e.message as Record<string, unknown>)
      }).start();
      const gateway = await new Gateway({
        config: configFor(scenario, harness),
        registryStore: catalogFor(scenario),
        nats: nc,
        record
      }).start();
      try {
        const result = await runScenario(scenario, {
          harness,
          connect: () => harness.offerCallAndAccept()
        });
        expect(result.status, result.reason).to.equal("passed");
      } finally {
        await gateway.stop();
        await harness.stop();
      }
    });
  }
});

// Recording policy through the real node's listener.attach (add-call-record 3.2): one unmixed RTP
// stream per side, written by the gateway's recorder and sealed into the record.
describe("@gateway call recording through the Go media node", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: MediaNodeBinaries | undefined;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    bins = buildMediaNode(NATS_URL);
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
    const gateway = await new Gateway({
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
      await gateway.stop();
      await harness.stop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// Every SIP codec the node negotiates reaches the app in the app's format (AO-B4): the gateway leg
// stays L16/16000 and the media node transcodes PCMU, PCMA, G.722 and Opus.
describe("@gateway SIP codecs through the Go media node", function () {
  this.timeout(30000);
  let nc: NatsConnection;
  let bins: MediaNodeBinaries | undefined;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    bins = buildMediaNode(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  for (const codec of ["PCMU/8000", "PCMA/8000", "G722/8000", "opus/48000"]) {
    it(`a ${codec} caller and a pcm16 app hear each other`, async function () {
      const harness = await new RealMediaHarness(nc, bins!, {
        vendorCalls: () => 0
      }).start();
      const gateway = await new Gateway({
        config: configFor({ name: codec } as Scenario, harness),
        nats: nc,
        record: new MemoryCallRecordSink()
      }).start();
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
        const commands = (await harness.measure("media.commands", 0)) as {
          type: string;
          rtp?: { codec?: string };
        }[];
        const gateLeg = commands.find((c) => c.type === "participant.add");
        expect(gateLeg?.rtp?.codec).to.equal("L16/16000");

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
        await gateway.stop();
        await harness.stop();
      }
    });
  }
});
