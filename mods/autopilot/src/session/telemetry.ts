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

let impl: Telemetry = initTelemetry("fonoster-autopilot");

/**
 * Autopilot's telemetry: a stable handle (like AppBridge's) that delegates to what
 * `startTelemetry`/`setTelemetry` installed. OTLP when an endpoint is configured
 * (telemetry.otlpEndpoint or OTEL_EXPORTER_OTLP_*), a no-op otherwise.
 *
 * Spans: autopilot.session (child of AppBridge's call span, via session.start `traceparent`),
 * autopilot.turn (STT final to the end of the reply) and autopilot.llm.request. Metrics:
 * fonoster.autopilot.turns, fonoster.autopilot.llm.requests and fonoster.autopilot.llm.latency_ms
 * (the sum of the time to the first token; divide by requests for the mean).
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

/** Installs a telemetry implementation (tests). */
export function setTelemetry(t: Telemetry) {
  impl = t;
}

/** Starts telemetry with the config's endpoint, once the config is loaded. */
export function startTelemetry(config: TelemetryConfig) {
  impl = initTelemetry("fonoster-autopilot", undefined, telemetryEnv(config));
}
