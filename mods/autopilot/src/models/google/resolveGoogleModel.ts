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
import { getLogger } from "@fonoster/logger";
import { GoogleModel } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

/**
 * Gemini 2.0 Flash models were shut down by Google on 2026-06-01.
 * Remap persisted configs so Autopilot does not 404 on generateContent.
 */
const RETIRED_GOOGLE_MODELS: Partial<Record<string, GoogleModel>> = {
  "gemini-2.0-flash": GoogleModel.GEMINI_2_5_FLASH,
  "gemini-2.0-flash-lite": GoogleModel.GEMINI_2_5_FLASH_LITE
};

function resolveGoogleModel(model: string): string {
  const replacement = RETIRED_GOOGLE_MODELS[model];
  if (!replacement) {
    return model;
  }

  logger.warn("remapping retired Google Gemini model", {
    from: model,
    to: replacement
  });
  return replacement;
}

export { resolveGoogleModel };
