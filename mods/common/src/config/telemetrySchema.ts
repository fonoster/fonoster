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
import { z } from "zod";

/**
 * The `telemetry` section shared by every Fonoster service's config file
 * (unify-config-placeholders): the OTLP/HTTP endpoint telemetry goes to. Empty or absent means
 * off, unless the container environment sets `OTEL_EXPORTER_OTLP_ENDPOINT`.
 */
const telemetrySchema = z
  .object({
    /** Usually `"${OTEL_EXPORTER_OTLP_ENDPOINT:-}"`, e.g. http://otel-collector:4318. */
    otlpEndpoint: z.string().optional()
  })
  .optional();

type TelemetryConfig = z.infer<typeof telemetrySchema>;

/**
 * The environment `initTelemetry` reads, with the config's endpoint (when set) in
 * `OTEL_EXPORTER_OTLP_ENDPOINT`.
 */
function telemetryEnv(
  config: TelemetryConfig,
  env: Record<string, string | undefined> = process.env
): Record<string, string | undefined> {
  const endpoint = config?.otlpEndpoint?.trim();
  return endpoint ? { ...env, OTEL_EXPORTER_OTLP_ENDPOINT: endpoint } : env;
}

export { telemetrySchema, telemetryEnv, TelemetryConfig };
