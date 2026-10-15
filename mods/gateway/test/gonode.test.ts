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
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { GatewayConfig } from "../src/config";
import { Gateway } from "../src/Gateway";

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
      const harness = await new RealMediaHarness(nc, bins!, {
        vendorCalls: () => 0
      }).start();
      const gateway = await new Gateway({
        config: configFor(scenario, harness),
        nats: nc
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
