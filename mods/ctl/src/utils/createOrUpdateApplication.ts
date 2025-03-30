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
import { readFileSync } from "fs";
import path from "path";
import * as SDK from "@fonoster/sdk";
import {
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "@fonoster/types";
import { load } from "js-yaml";
import { AppConfig } from "./types";

export async function createOrUpdateApplication(
  client: SDK.Client,
  filePath: string,
  appRef?: string
) {
  const fileContent = readFileSync(filePath, "utf8");
  const fileExt = path.extname(filePath).toLowerCase();
  let config: CreateApplicationRequest & AppConfig;

  if (fileExt === ".yaml" || fileExt === ".yml") {
    config = load(fileContent) as CreateApplicationRequest & AppConfig;
  } else if (fileExt === ".json") {
    config = JSON.parse(fileContent) as CreateApplicationRequest & AppConfig;
  } else {
    throw new Error("Unsupported file format. Please use YAML or JSON files.");
  }

  const applications = new SDK.Applications(client);

  delete config.testCases;
  delete config.intelligence?.config?.languageModel?.apiKey;

  if (appRef) {
    const updateConfig: UpdateApplicationRequest = {
      ref: appRef,
      ...config
    };
    return applications.updateApplication(updateConfig);
  } else {
    return applications.createApplication(config);
  }
}
