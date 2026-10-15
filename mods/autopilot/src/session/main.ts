#!/usr/bin/env node
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
import * as fs from "fs";
import { initTelemetry } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceServer } from "@fonoster/voice/session";
import * as yaml from "js-yaml";
import { createAutopilotHandler } from "./createAutopilot";
import type { ThinkProvider } from "./think";

/**
 * The hosted Autopilot session engine as a plain container (add-platform): a session app the
 * gateway dials over the session protocol. One YAML file, no .env.
 *
 *   port: 3000
 *   host: 0.0.0.0
 *   signingSecret: secret-or-inline
 *   assistantFile: /etc/fonoster/assistant.json   # the assistant every session runs
 *   providers: { openai: { baseUrl: https://api.openai.com/v1, apiKey: ... } }
 */
type SessionEngineConfig = {
  port?: number;
  host?: string;
  signingSecret: string;
  assistantFile: string;
  providers?: Record<string, ThinkProvider>;
};

const logger = getLogger({ service: "autopilot", filePath: __filename });
const telemetry = initTelemetry("fonoster-autopilot");

async function main() {
  const file =
    process.env.AUTOPILOT_SESSION_CONFIG ??
    process.argv[2] ??
    "/etc/fonoster/autopilot-session.yaml";
  const config = yaml.load(
    fs.readFileSync(file, "utf8")
  ) as SessionEngineConfig;
  if (!config?.signingSecret || !config?.assistantFile)
    throw new Error(
      `invalid ${file}: signingSecret and assistantFile are required`
    );

  const assistant = JSON.parse(fs.readFileSync(config.assistantFile, "utf8"));
  const handler = createAutopilotHandler({
    assistant,
    providers: config.providers
  });
  const server = await new VoiceServer({
    port: config.port ?? 3000,
    host: config.host ?? "0.0.0.0",
    signingSecret: config.signingSecret
  }).listen(async (session) => {
    telemetry.count("fonoster.autopilot.sessions.total");
    await handler(session);
  });

  const shutdown = async () => {
    logger.info("shutting down");
    await server.close();
    await telemetry.shutdown();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((e) => {
  logger.error(e.message);
  process.exit(1);
});
