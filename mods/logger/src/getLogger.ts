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
import winston from "winston";
import { endFluent, getSettings, getTransports } from "./envs";
import { redactFormat } from "./redact";
import { register } from "./registry";

const loggers = new Map();

function getLogger(config: { service?: string; filePath: string }) {
  const key = config.service || "default";

  if (loggers.has(key)) {
    return loggers.get(key);
  }

  const humanFormat = winston.format.combine(
    redactFormat(),
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss.SSS"
    }),
    winston.format.printf(
      ({ level, message, timestamp, ...metadata }) =>
        `${timestamp} [${level}]: ${
          config.service ? `(${config.service})` : ""
        } ${message} ${JSON.stringify(metadata)}`
    )
  );

  const newLogger = register(
    winston.createLogger({
      levels: winston.config.npm.levels,
      format: humanFormat,
      transports: getTransports(),
      level: getSettings().level
    })
  );

  newLogger.on("finish", endFluent);

  loggers.set(key, newLogger);

  return newLogger;
}

export { getLogger };
