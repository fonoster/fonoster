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
import { Messages, VoiceLanguage } from "@fonoster/common";
import { z } from "zod";
import {
  DEEPGRAM_MULTILINGUAL,
  DeepgramModel,
  MULTILINGUAL_MODELS
} from "./types";

/** Deepgram STT config and credential schemas (application validation only). */
class Deepgram {
  static getConfigValidationSchema(): z.Schema {
    return z
      .object({
        smartFormat: z.boolean().optional(),
        noDelay: z.boolean().optional(),
        languageCode: z
          .union(
            [z.nativeEnum(VoiceLanguage), z.literal(DEEPGRAM_MULTILINGUAL)],
            { error: Messages.VALID_LANGUAGE_CODE }
          )
          .optional(),
        model: z
          .nativeEnum(DeepgramModel, { message: "Invalid Deepgram model" })
          .optional(),
        interimResults: z.boolean().optional(),
        utteranceEndMs: z.number().int().min(1000).max(5000).optional()
      })
      .refine(
        (config) =>
          config.languageCode !== DEEPGRAM_MULTILINGUAL ||
          !config.model ||
          MULTILINGUAL_MODELS.includes(config.model),
        {
          message: `Language "${DEEPGRAM_MULTILINGUAL}" requires one of these models: ${MULTILINGUAL_MODELS.join(", ")}`,
          path: ["model"]
        }
      );
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({ apiKey: z.string() });
  }
}

export { Deepgram };
