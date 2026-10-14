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
import { applySettings, buildFormat, getSettings, getTransports } from "./envs";
import defaultLogger from "./logger";
import { registry } from "./registry";

type LoggerOptions = {
  level?: string;
  format?: "json" | "text";
  transport?: "console" | "fluent";
  fluent?: { host?: string; port?: number; tagPrefix?: string };
};

/**
 * Configures logging from a service's config file. Loggers created earlier
 * (including at import time) switch to the new level and transport.
 * Before this is called, settings come from environment variables.
 */
function configureLogger(options: LoggerOptions) {
  const current = getSettings();

  applySettings({
    level: options.level ?? current.level,
    format: options.format ?? current.format,
    transport: options.transport ?? current.transport,
    fluent: { ...current.fluent, ...options.fluent }
  });

  const { level } = getSettings();

  for (const logger of registry) {
    logger.clear();
    getTransports().forEach((transport) => logger.add(transport));
    logger.level = level;
  }

  // Per-service loggers keep their own human-readable format; only the
  // default logger follows logs.format, as it does with LOGS_FORMAT.
  defaultLogger.format = buildFormat();
}

export { configureLogger, LoggerOptions };
