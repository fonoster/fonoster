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
  OtlpCollector,
  RealMediaHarness,
  Scenario
} from "@fonoster/conformance";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { AppBridgeConfig } from "../src/config";
import { AppBridge } from "../src/AppBridge";
import { MemoryCallRecordSink } from "../src/record/CallRecordSink";
import { startTelemetry, stopTelemetry } from "../src/telemetry";
import { appsFor } from "./scenarioApps";

// Observability (harden-conformance 1.3): one real call through AppBridge and a Roomr node
// (roomr-fake), AppBridge pointed at a test OTLP collector. It must deliver traces, metrics and logs
// under its service.name, and the call's spans and logs must carry its `fonoster.call_ref`. The
// node's own telemetry is proven in fonoster/roomr; the apiserver's part is in
// mods/apiserver/test/core/telemetryOtlp.test.ts. Needs NATS (CONFORMANCE_NATS_URL).
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const CALL_REF_ATTR = "fonoster.call_ref";

function configFor(
  harness: RealMediaHarness,
  endpoint: string
): AppBridgeConfig {
  const urls = harness.providerUrls;
  return {
    nats: { url: NATS_URL! },
    session: { listen: "127.0.0.1:0" },
    retry: { windowMs: 600, intervalMs: 100 },
    apps: appsFor({ name: "observability" } as Scenario, harness, "fonoster"),
    providers: {
      fake: {
        adapter: "fake",
        capabilities: ["tts", "stt"],
        tts: { url: urls.tts, timeoutMs: 1500 },
        stt: { url: urls.stt }
      }
    },
    telemetry: { otlpEndpoint: endpoint }
  } as AppBridgeConfig;
}

describe("@appbridge OpenTelemetry signals from one real call (Roomr node in roomr-fake)", function () {
  this.timeout(60000);
  let nc: NatsConnection;

  before(async function () {
    this.timeout(120000);
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  it("AppBridge delivers traces, logs and metrics tagged with the call ref (the node's own telemetry is Roomr's to prove)", async function () {
    const collector = await new OtlpCollector().start();
    const callRef = `obs-${Date.now()}`;
    const harness = new RealMediaHarness({ vendorCalls: () => 0 });
    await harness.start();
    const config = configFor(harness, collector.endpoint);
    startTelemetry(config.telemetry);
    const appbridge = await new AppBridge({
      tap: harness.tap,
      config,
      nats: nc,
      record: new MemoryCallRecordSink()
    }).start();
    // The node opens each call's control stream to this AppBridge.
    harness.sessionEndpoint = appbridge.sessionEndpoint;
    try {
      await harness.offerCallAndAccept(5000, { callRef });
      await harness.caller({ audio: { kind: "tone", ms: 300 } });
      await harness.caller({ hangup: true });

      // Ending the call ends its span; stopping each service flushes what is still batched.
      await appbridge.stop();
      await stopTelemetry();

      const gw = "fonoster-appbridge";
      await collector.until(
        () =>
          collector.has(gw, "traces", CALL_REF_ATTR, callRef) &&
          collector.has(gw, "logs", CALL_REF_ATTR, callRef) &&
          collector.has(gw, "metrics"),
        "every signal from AppBridge"
      );
      expect(collector.has(gw, "metrics", "fonoster.appbridge.calls.total")).to
        .be.true;
    } finally {
      await appbridge.stop().catch(() => undefined);
      await stopTelemetry();
      await harness.stop();
      await collector.stop();
    }
  });
});
