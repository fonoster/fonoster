/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { resolve } from "path";
import { fluent, level, transports } from "./envs";
import winston from "winston";

const loggers = new Map();

export const getLogger = (config: { service?: string; filePath: string }) => {
  const key = (config.service || "default") + config.filePath;

  if (loggers.has(key)) {
    return loggers.get(key);
  }

  const file = config.filePath.replace(resolve("./"), "");

  const humanFormat = winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-dd HH:mm:ss.SSS"
    }),
    winston.format.printf(
      ({ level, message, timestamp, ...metadata }) =>
        `${timestamp} [${level}]: ${
          config.service ? `(${config.service})` : ""
        } ${file} ${message} ${JSON.stringify(metadata)}`
    )
  );

  const newLogger = winston.createLogger({
    levels: winston.config.npm.levels,
    format: humanFormat,
    transports,
    level
  });

  newLogger.on("finish", () => {
    fluent.sender.end("end", {}, () => {});
  });

  // Store the new logger in the map
  loggers.set(key, newLogger);

  return newLogger;
};

export { getLogger as default };
