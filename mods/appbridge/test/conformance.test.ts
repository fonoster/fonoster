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
import { expect } from "chai";
import { NatsConnection, connect } from "nats";
import { Webhooks } from "@fonoster/common";
import {
  FakesHarness,
  loadScenarios,
  runScenario,
  Scenario,
  scenarioCase
} from "@fonoster/conformance";
import { AppBridge, AppBridgeConfig, MemoryCallRecordSink } from "../src";
import { catalogFor } from "./scenarioCatalog";
import { appsFor, placeOutbound, recordReaders } from "./scenarioApps";

// The conformance suites for voice-session and twilio-media-streams-flavor, run against this
// AppBridge with the fakes. Needs NATS: set CONFORMANCE_NATS_URL (e.g. nats://127.0.0.1:4222).
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

function configFor(scenario: Scenario, harness: FakesHarness): AppBridgeConfig {
  const urls = harness.providerUrls;
  return {
    nats: { url: NATS_URL! },
    retry: { windowMs: 600, intervalMs: 100 },
    apps: appsFor(scenario, harness),
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

for (const contract of [
  "voice-session",
  "twilio-media-streams-flavor",
  "turn-taking"
] as const) {
  describe(`@AppBridge conformance: ${contract}`, function () {
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
    this.timeout(15000);
    let nc: NatsConnection;

    before(async function () {
      if (!NATS_URL) return this.skip();
      nc = await connect({ servers: NATS_URL });
    });

    after(async function () {
      await nc?.close();
    });

    for (const scenario of loadScenarios(contract)) {
      // The catalog case that runs this file, when its area is brought (twilio: VSD).
      it(`${scenarioCase(contract, scenario.name)}${scenario.name}`, async function () {
        const record = new MemoryCallRecordSink();
        const webhooks: Webhooks.WebhookEvent[] = [];
        const harness = await new FakesHarness({
          vendorCalls: () => 0,
          ...recordReaders(record),
          webhookEvents: () =>
            webhooks.map((e) => ({ type: e.type, ...e.data }))
        }).start();
        harness.roomrNode.attachNats(nc, {
          commands: `media.${harness.roomrNode.nodeId}.commands`,
          events: `media.${harness.roomrNode.nodeId}.events`
        });
        const appbridge = await new AppBridge({
          config: configFor(scenario, harness),
          nats: nc,
          record,
          registryStore: catalogFor(scenario),
          webhooks: (e) => webhooks.push(e)
        }).start();
        try {
          const result = await runScenario(scenario, {
            harness,
            connect: () =>
              scenario.setup?.call?.direction === "outbound"
                ? placeOutbound(nc, harness, scenario)
                : harness.offerCallAndAccept()
          });
          expect(result.status, result.reason).to.equal("passed");
        } finally {
          await appbridge.stop();
          await harness.stop();
        }
      });
    }
  });
}
