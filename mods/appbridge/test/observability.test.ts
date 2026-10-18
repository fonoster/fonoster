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
  RoomrBinaries,
  OtlpCollector,
  RealMediaHarness,
  Scenario
} from "@fonoster/conformance";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { GatewayConfig } from "../src/config";
import { Gateway } from "../src/Gateway";
import { MemoryCallRecordSink } from "../src/record/CallRecordSink";
import { startTelemetry, stopTelemetry } from "../src/telemetry";
import { appsFor } from "./scenarioApps";

// Observability (harden-conformance 1.3): one real call through the gateway and the Go Roomr node,
// both pointed at a test OTLP collector. Each must deliver traces, metrics and logs under its
// service.name, and the call's spans and logs must carry its `fonoster.call_ref`. (The node writes
// no log record for a normal call, only node-level ones, so its call-tagged signal is the span.) The apiserver's
// part is in mods/apiserver/test/core/telemetryOtlp.test.ts. Needs NATS (CONFORMANCE_NATS_URL) and
// a Go toolchain.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const CALL_REF_ATTR = "fonoster.call_ref";

function configFor(harness: RealMediaHarness, endpoint: string): GatewayConfig {
  const urls = harness.providerUrls;
  return {
    nats: { url: NATS_URL! },
    testMode: true,
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
  } as GatewayConfig;
}

describe("@gateway OpenTelemetry signals from one real call (Go Roomr node)", function () {
  this.timeout(60000);
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

  it("the gateway and the Roomr node deliver traces and metrics (the node sends no OTLP logs) tagged with the call ref", async function () {
    const collector = await new OtlpCollector().start();
    const callRef = `obs-${Date.now()}`;
    const harness = new RealMediaHarness(nc, bins!, { vendorCalls: () => 0 });
    // The node reads the standard OTEL_* variables when its file sets no endpoint.
    harness.media.env = { OTEL_EXPORTER_OTLP_ENDPOINT: collector.endpoint };
    await harness.start();
    const config = configFor(harness, collector.endpoint);
    startTelemetry(config.telemetry);
    const gateway = await new Gateway({
      config,
      nats: nc,
      record: new MemoryCallRecordSink()
    }).start();
    try {
      await harness.offerCallAndAccept(5000, { callRef });
      await harness.caller({ audio: { kind: "tone", ms: 300 } });
      await harness.caller({ hangup: true });

      // Ending the call ends its span; stopping each service flushes what is still batched.
      await gateway.stop();
      await stopTelemetry();
      await harness.media.shutdown();

      const gw = "fonoster-gateway";
      const node = "fonoster-roomr";
      await collector.until(
        () =>
          collector.has(gw, "traces", CALL_REF_ATTR, callRef) &&
          collector.has(gw, "logs", CALL_REF_ATTR, callRef) &&
          collector.has(gw, "metrics") &&
          collector.has(node, "traces", CALL_REF_ATTR, callRef) &&
          collector.has(node, "metrics"),
        "every signal from the gateway and the Roomr node"
      );
      expect(collector.has(gw, "metrics", "fonoster.gateway.calls.total")).to.be
        .true;
    } finally {
      await gateway.stop().catch(() => undefined);
      await stopTelemetry();
      await harness.stop();
      await collector.stop();
    }
  });
});
