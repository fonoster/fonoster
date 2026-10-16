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
import { initTelemetry, Telemetry, telemetryEnv } from "@fonoster/common";
import { getConfig } from "../config";

let telemetry: Telemetry | undefined;

/**
 * The apiserver's telemetry (add-platform 2.5): off unless an OTLP endpoint is configured
 * (`telemetry.otlpEndpoint` in fonoster.yaml, else OTEL_EXPORTER_OTLP_ENDPOINT), then traces, logs and metrics over
 * OTLP/HTTP like the other services.
 */
function configuredTelemetry() {
  try {
    return getConfig().telemetry;
  } catch {
    // No loadable config (tests, tools): the environment alone decides.
    return undefined;
  }
}

export function apiserverTelemetry(): Telemetry {
  telemetry ??= initTelemetry(
    "fonoster-apiserver",
    undefined,
    telemetryEnv(configuredTelemetry())
  );
  return telemetry;
}
