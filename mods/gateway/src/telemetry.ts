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

/**
 * The gateway's telemetry (add-platform observability): OTLP when OTEL_EXPORTER_OTLP_* is set,
 * a no-op otherwise. Started on import so spans from the first call are not lost; main.ts flushes
 * it on shutdown. Call spans, logs and metrics carry `fonoster.call_ref`.
 */
export const telemetry: Telemetry = initTelemetry("fonoster-gateway");
