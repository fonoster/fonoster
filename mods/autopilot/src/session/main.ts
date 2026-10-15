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
// Autopilot's entry point (rework-autopilot task 4.3; the only engine since cleanbreak CB-B5):
//
//   node dist/session/main.js --config /etc/fonoster/autopilot-session.yaml
import { initTelemetry } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { loadHostedConfig, startHostedAutopilot } from "./hosted";

const logger = getLogger({ service: "autopilot", filePath: __filename });

// Off unless an OTLP endpoint is configured (add-platform observability).
initTelemetry("fonoster-autopilot");

const at = process.argv.indexOf("--config");
const file =
  at >= 0
    ? process.argv[at + 1]
    : (process.env.AUTOPILOT_SESSION_CONFIG ??
      "./config/autopilot-session.yaml");

startHostedAutopilot(loadHostedConfig(file)).catch((e: Error) => {
  logger.error(`hosted autopilot failed to start: ${e.message}`);
  process.exit(1);
});
