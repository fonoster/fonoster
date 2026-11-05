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

/**
 * Drops a call below the logger's current level before any other format runs.
 * winston runs a logger's format before its transports check the level, so
 * without this a dropped call still pays for redaction and serialization.
 * Put it first: `colorize` rewrites `info.level`.
 */
const levelGate = (logger: winston.Logger) =>
  winston.format((info) =>
    logger.isLevelEnabled(info.level) ? info : false
  )();

export { levelGate };
