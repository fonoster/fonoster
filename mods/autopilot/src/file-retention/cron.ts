/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster
 *
 * This file is part of nodejs-voiceapp
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
import { ServerConfig } from "../types";
import { runFileRetentionPolicy } from "./task";
import { getLogger } from "@fonoster/logger";
import cron from "node-cron";

const logger = getLogger({ service: "autopilot", filePath: __filename });

export const startFileRetentionPolicy = (config: ServerConfig) => {
  if (config.fileRetentionPolicyEnabled) {
    logger.info("file retention policy enabled");

    cron.schedule(config.fileRetentionPolicyCronExpression, () =>
      runFileRetentionPolicy({
        filesDirectory: config.fileRetentionPolicyDirectory,
        maxFileAge: config.fileRetentionPolicyMaxAge,
        fileExtension: config.fileRetentionPolicyExtension
      })
    );

    return;
  }

  logger.info(
    "file retention policy is disabled, all files will be kept forever in the server"
  );
};
