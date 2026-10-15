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
import { getLogger } from "@fonoster/logger";
import { loadConfig } from "./config";
import { Gateway } from "./Gateway";
import { JsonlCallRecordSink } from "./record/CallRecordSink";

const logger = getLogger({ service: "gateway", filePath: __filename });

async function main() {
  const file =
    process.env.GATEWAY_CONFIG ??
    process.argv[2] ??
    "/etc/fonoster/gateway.yaml";
  const config = loadConfig(file);
  const recordDir = process.env.GATEWAY_RECORD_DIR;
  const gateway = await new Gateway({
    config,
    record: recordDir ? new JsonlCallRecordSink(recordDir) : undefined
  }).start();

  const shutdown = async () => {
    logger.info("shutting down");
    await gateway.stop();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((e) => {
  logger.error(e.message);
  process.exit(1);
});
