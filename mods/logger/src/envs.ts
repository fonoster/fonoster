/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import winston from "winston";
import fluentLogger from "fluent-logger";
const fluentTransport = fluentLogger.support.winstonTransport();

const fluent = new fluentTransport(
  `${process.env.LOG_OPT_TAG_PREFIX}.fonoster`,
  {
    host: process.env.LOGS_DRIVER_HOST,
    port: process.env.LOGS_DRIVER_PORT,
    timeout: 3.0,
    requireAckResponse: true
  }
);

const format =
  process.env.LOGS_FORMAT === "json"
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      );
const level = process.env.LOGS_LEVEL ? process.env.LOGS_LEVEL : "info";
const transports =
  process.env.LOGS_TRANSPORT === "fluent"
    ? [fluent]
    : [new winston.transports.Console()];

export { format, level, transports, fluent };
