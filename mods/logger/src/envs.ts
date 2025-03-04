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
import fluentLogger from "fluent-logger";
import winston from "winston";
import { getEnv } from "./getEnv";

const FluentTransport = fluentLogger.support.winstonTransport();

const LOGS_DRIVER_HOST = getEnv("LOGS_DRIVER_HOST");
// Note: if LOGS_DRIVER_PORT is provided as a string in the environment, it will be used as-is.
const LOGS_DRIVER_PORT = getEnv("LOGS_DRIVER_PORT", 24224);
const LOGS_OPT_TAG_PREFIX = getEnv("LOGS_OPT_TAG_PREFIX", "fonoster-logs");
const LOGS_FORMAT = getEnv("LOGS_FORMAT", "json");
const LOGS_LEVEL = getEnv("LOGS_LEVEL", "info");
const LOGS_TRANSPORT = getEnv<"console" | "fluent">(
  "LOGS_TRANSPORT",
  "console"
);

const fluent = new FluentTransport(`${LOGS_OPT_TAG_PREFIX}`, {
  host: LOGS_DRIVER_HOST,
  port: LOGS_DRIVER_PORT,
  timeout: 3.0,
  requireAckResponse: false
});

const format =
  LOGS_FORMAT === "json"
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      );

const transports =
  LOGS_TRANSPORT === "fluent" ? [fluent] : [new winston.transports.Console()];

export { fluent, format, LOGS_LEVEL as level, transports };
