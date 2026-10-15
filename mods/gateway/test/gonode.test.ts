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
import { Webhooks } from "@fonoster/common";
import { connect, NatsConnection } from "nats";
import { GatewayConfig } from "../src/config";
import { Gateway } from "../src/Gateway";
import { MemoryCallRecordSink } from "../src/record/CallRecordSink";
import { catalogFor } from "./scenarioCatalog";
import { appsFor, recordReaders } from "./scenarioApps";

// The voice-session suite through the gateway, the Go media node and a SIP caller bot: real SIP,
// RTP and media-control end to end (add-media-node 3.x, the first-call milestone). Needs NATS
// (CONFORMANCE_NATS_URL) and a Go toolchain.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

// Node features not built yet, and assertions only the fake node can make.
const NOT_YET: Record<string, string> = {
  "media-timeout-ends-session":
    "drop is a fake-node action (the real timeout is 30 s)",
  "outbound-answered":
    "outbound calls need a callee bot answering the node's INVITE (not in the real-media harness)",
  "outbound-busy":
    "outbound calls need a callee bot answering the node's INVITE (not in the real-media harness)"
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
    apps: appsFor(scenario, harness, "native"),
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
      const webhooks: Webhooks.WebhookEvent[] = [];
      const harness = await new RealMediaHarness(nc, bins!, {
        vendorCalls: () => 0,
        ...recordReaders(record),
        webhookEvents: () => webhooks.map((e) => ({ type: e.type, ...e.data }))
      }).start();
      const gateway = await new Gateway({
        config: configFor(scenario, harness),
        registryStore: catalogFor(scenario),
        nats: nc,
        record,
        webhooks: (e) => webhooks.push(e)
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
