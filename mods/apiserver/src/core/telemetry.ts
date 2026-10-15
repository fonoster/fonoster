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
import { initTelemetry, Telemetry } from "@fonoster/common";

let telemetry: Telemetry | undefined;

/**
 * The apiserver's telemetry (add-platform 2.5): off unless an OTLP endpoint is configured
 * (OTEL_EXPORTER_OTLP_ENDPOINT; the Helm chart sets it), then traces, logs and metrics over
 * OTLP/HTTP like the other services.
 */
export function apiserverTelemetry(): Telemetry {
  telemetry ??= initTelemetry("fonoster-apiserver");
  return telemetry;
}
