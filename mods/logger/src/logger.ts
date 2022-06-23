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

export enum ULogType {
  APP = "app",
  CALL = "call",
  SIP = "sip"
}

// User Logging
export interface ULog {
  accessKeyId: string;
  eventType: ULogType;
  level: "info" | "error" | "verbose" | "warn";
  message: string;
  body?: Record<string, unknown>;
}

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
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      );
const level = process.env.LOGS_LEVEL ? process.env.LOGS_LEVEL : "info";
const transports =
  process.env.LOGS_TRANSPORT === "fluent"
    ? [fluent]
    : [new winston.transports.Console()];

const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  format,
  transports,
  level
});

logger.on("finish", () => {
  fluent.sender.end("end", {}, () => {});
});

const mute = () => logger.transports.forEach((t: any) => (t.silent = true));

const unmute = () => logger.transports.forEach((t: any) => (t.silent = false));

const ulogger = (log: ULog) =>
  logger[log.level](log.message, {
    eventType: log.eventType,
    body: log.body,
    level: log.level,
    accessKeyId: log.accessKeyId
  });

export {logger as default, ulogger, mute, unmute};
