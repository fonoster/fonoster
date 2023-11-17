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
import { mute } from "@fonoster/logger";
import { join } from "path";
import { homedir } from "os";
const BASE_DIR = join(homedir(), ".fonoster");
const PATH_TO_CONFIG = join(BASE_DIR, "config");
const fs = require("fs");

mute();

export interface ProjectConfig {
  endpoint: string;
  accessKeyId: string;
  accessKeySecret: string;
}

export interface Config {
  endpoint: string;
  accessKeyId: string;
  accessKeySecret: string;
  defaultProject?: {
    name: string;
    accessKeyId: string;
    accessKeySecret: string;
  };
}

export function getConfig(): Config {
  if (!fs.existsSync(BASE_DIR)) {
    throw new Error("no config found");
  }
  try {
    return JSON.parse(fs.readFileSync(PATH_TO_CONFIG));
  } catch (e) {
    throw new Error("malformed config: " + e);
  }
}

export function getProjectConfig() {
  const { endpoint, defaultProject } = getConfig();
  return {
    endpoint,
    accessKeyId: defaultProject.accessKeyId,
    accessKeySecret: defaultProject.accessKeySecret
  };
}

export function setConfig(config: Config) {
  if (fs.existsSync(BASE_DIR)) {
    fs.rmSync(BASE_DIR, { recursive: true });
  }
  fs.mkdirSync(BASE_DIR, { recursive: true });
  fs.writeFileSync(PATH_TO_CONFIG, JSON.stringify(config, null, " "));
}

export function unsetDefaultProject() {
  const config = getConfig();
  config.defaultProject = void 0;
  setConfig(config);
}

export function isDefaultProject(ref: string) {
  const config = getConfig();
  return config.defaultProject && config.defaultProject.accessKeyId === ref;
}

export function hasProjectConfig() {
  const config = getConfig();
  return config.defaultProject;
}
