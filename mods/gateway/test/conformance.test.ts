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
import {
  FakesHarness,
  Scenario,
  loadScenarios,
  runScenario
} from "@fonoster/conformance";
import { Gateway, GatewayConfig, MemoryCallRecordSink } from "../src";

// The conformance suites for voice-session and twilio-media-streams-flavor, run against this
// gateway with the fakes. Needs NATS: set CONFORMANCE_NATS_URL (e.g. nats://127.0.0.1:4222).
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const SECRET = "conformance-secret";

function configFor(scenario: Scenario, harness: FakesHarness): GatewayConfig {
  const urls = harness.providerUrls;
  return {
    nats: { url: NATS_URL! },
    testMode: true,
    retry: { windowMs: 600, intervalMs: 100 },
    apps: [
      {
        ref: "app-1",
        url: harness.app.url,
        flavor:
          scenario.setup?.app?.flavor ??
          (scenario.contract === "twilio-media-streams-flavor"
            ? "twilio"
            : "native"),
        signingSecret: scenario.setup?.app?.signingSecret ?? SECRET,
        speech: {
          voice: "fake/default",
          language: "en-US",
          ...(scenario.setup?.app?.speech ?? {})
        }
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

for (const contract of [
  "voice-session",
  "twilio-media-streams-flavor",
  "turn-taking"
] as const) {
  describe(`@gateway conformance: ${contract}`, function () {
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
      it(scenario.name, async function () {
        const record = new MemoryCallRecordSink();
        const harness = await new FakesHarness({
          vendorCalls: () => 0,
          recordEvents: (type) =>
            [...record.records.values()]
              .flat()
              .filter((e) => e.source === "event" && e.message.type === type)
              .map((e) => e.message as Record<string, unknown>)
        }).start();
        harness.mediaNode.attachNats(nc, {
          commands: `media.${harness.mediaNode.nodeId}.commands`,
          events: `media.${harness.mediaNode.nodeId}.events`
        });
        const gateway = await new Gateway({
          config: configFor(scenario, harness),
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
}
