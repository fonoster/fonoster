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
import { fluent, format, level, transports } from "./envs";
import { ULog } from "./types";

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

export { logger as default, mute, unmute };
