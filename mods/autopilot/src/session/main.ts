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
// The hosted Autopilot's entry point (rework-autopilot task 4.3):
//
//   AUTOPILOT_CONFIG=/etc/fonoster/autopilot.yaml node dist/session/main.js
import { getLogger } from "@fonoster/logger";
import { loadHostedConfig, startHostedAutopilot } from "./hosted";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const file = process.env.AUTOPILOT_CONFIG ?? "./autopilot.yaml";

startHostedAutopilot(loadHostedConfig(file)).catch((e: Error) => {
  logger.error(`hosted autopilot failed to start: ${e.message}`);
  process.exit(1);
});
