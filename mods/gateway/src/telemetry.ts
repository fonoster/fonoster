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
import {
  initTelemetry,
  Telemetry,
  TelemetryConfig,
  telemetryEnv
} from "@fonoster/common";

let impl: Telemetry = initTelemetry("fonoster-gateway");

/**
 * The gateway's telemetry (add-platform observability): OTLP when `telemetry.otlpEndpoint` in
 * gateway.yaml (or OTEL_EXPORTER_OTLP_*) is set, a no-op otherwise. A stable handle: modules
 * import it before the config is read, and `startTelemetry` swaps what it delegates to. main.ts
 * flushes it on shutdown. Call spans, logs and metrics carry `fonoster.call_ref`.
 */
export const telemetry: Telemetry = {
  get enabled() {
    return impl.enabled;
  },
  startCall: (...a) => impl.startCall(...a),
  startSpan: (...a) => impl.startSpan(...a),
  traceparent: (...a) => impl.traceparent(...a),
  log: (...a) => impl.log(...a),
  count: (...a) => impl.count(...a),
  gauge: (...a) => impl.gauge(...a),
  shutdown: () => impl.shutdown()
};

/** Starts telemetry with the config's endpoint, once the config is loaded. */
export function startTelemetry(config: TelemetryConfig) {
  if (!config?.otlpEndpoint?.trim() || impl.enabled) return;
  impl = initTelemetry("fonoster-gateway", undefined, telemetryEnv(config));
}
