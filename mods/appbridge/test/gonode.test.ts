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
  loadScenarios,
  RealMediaHarness,
  runScenario,
  Scenario
} from "@fonoster/conformance";
import { expect } from "chai";
import { Webhooks } from "@fonoster/common";
import { connect, NatsConnection } from "nats";
import { AppBridgeConfig } from "../src/config";
import { AppBridge } from "../src/AppBridge";
import { MemoryCallRecordSink } from "../src/record/CallRecordSink";
import { catalogFor } from "./scenarioCatalog";
import { appsFor, recordReaders } from "./scenarioApps";

// The voice-session suite through AppBridge, a Roomr node and its phone (roomr-fake): real SIP,
// RTP and the per-call control stream end to end (add-roomr 3.x, redesign-roomr 5.3). Needs NATS
// (CONFORMANCE_NATS_URL) and roomr-fake (a binary in $ROOMR_FAKE_BIN, else Docker).
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

describe("@appbridge voice-session through a Roomr node", function () {
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

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async function () {
    await nc?.close();
  });

  // QA catalog ROM-040 (areas/roomr.md); what the real node cannot do yet is not a test here.
  const scenarios: Scenario[] = loadScenarios("voice-session").filter(
    (s) => !NOT_YET[s.name]
  );
  for (const scenario of scenarios) {
    it(`[APB-031] ${scenario.name}`, async function () {
      const record = new MemoryCallRecordSink();
      const webhooks: Webhooks.WebhookEvent[] = [];
      const harness = await new RealMediaHarness({
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

// Recording policy through the real node's AddListener (add-call-record 3.2): one unmixed RTP
// stream per side, written by AppBridge's recorder and sealed into the record.
describe("@appbridge no audio on the bus (Roomr node)", function () {
  this.timeout(30000);
  let nc: NatsConnection;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  it("[APB-031] no NATS message carries audio while a call has audio both ways", async function () {
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
    const harness = await new RealMediaHarness({
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
