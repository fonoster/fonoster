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
import { redactFormat } from "./redact";

const FluentTransport = fluentLogger.support.winstonTransport();

type LoggerSettings = {
  level: string;
  format: "json" | "text";
  transport: "console" | "fluent";
  fluent: { host?: string; port: number; tagPrefix: string };
};

/** Settings from environment variables: the default until `configureLogger` runs. */
function settingsFromEnv(): LoggerSettings {
  return {
    level: getEnv("LOGS_LEVEL", "info"),
    format: getEnv("LOGS_FORMAT", "json") === "json" ? "json" : "text",
    transport: getEnv<"console" | "fluent">("LOGS_TRANSPORT", "console"),
    fluent: {
      host: getEnv("LOGS_DRIVER_HOST"),
      // If LOGS_DRIVER_PORT is a string in the environment, it is used as-is.
      port: getEnv("LOGS_DRIVER_PORT", 24224),
      tagPrefix: getEnv("LOGS_OPT_TAG_PREFIX", "fonoster-logs")
    }
  };
}

let settings: LoggerSettings = settingsFromEnv();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fluent: any;
let transports: winston.transport[] = [];

function buildTransports() {
  if (settings.transport === "fluent") {
    fluent = new FluentTransport(settings.fluent.tagPrefix, {
      host: settings.fluent.host,
      port: settings.fluent.port,
      timeout: 3.0,
      requireAckResponse: false
    });
    transports = [fluent];
  } else {
    fluent = undefined;
    transports = [new winston.transports.Console()];
  }
}

buildTransports();

function buildFormat() {
  return settings.format === "json"
    ? winston.format.combine(
        redactFormat(),
        winston.format.timestamp(),
        winston.format.json()
      )
    : winston.format.combine(
        redactFormat(),
        winston.format.colorize(),
        winston.format.simple()
      );
}

const getSettings = () => settings;
const getTransports = () => transports;

/** Ends the Fluent sender, if one is in use. */
function endFluent() {
  fluent?.sender?.end("end", {}, () => {});
}

function applySettings(next: LoggerSettings) {
  settings = next;
  buildTransports();
}

export {
  applySettings,
  buildFormat,
  endFluent,
  getSettings,
  getTransports,
  LoggerSettings,
  settingsFromEnv
};
