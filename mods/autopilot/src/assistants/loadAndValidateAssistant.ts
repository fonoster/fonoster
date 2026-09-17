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
import fs from "fs";
import path from "path";
import { assistantSchema } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { load as loadYaml } from "js-yaml";
import { AssistantConfig } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

function loadAndValidateAssistant(assistantPath: string): AssistantConfig {
  if (!fs.existsSync(assistantPath)) {
    logger.error("assistant file not found", { path: assistantPath });
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(assistantPath, "utf8");
    const isYaml = [".yaml", ".yml"].includes(
      path.extname(assistantPath).toLowerCase()
    );
    const assistant = (
      isYaml ? loadYaml(fileContent) : JSON.parse(fileContent)
    ) as unknown;

    return assistantSchema.parse(assistant);
  } catch (e) {
    logger.error("error parsing or validating assistant file", {
      path: assistantPath,
      error: e
    });
    process.exit(1);
  }
}

export { loadAndValidateAssistant };
