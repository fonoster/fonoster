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
import { hostOrHostPortSchema } from "@fonoster/common";
import { ApplicationType } from "@prisma/client";
import { z } from "zod";
import { assistantWithoutApiKeySchema } from "./assistantWithoutApiKeySchema";
import { speechValidators } from "./speechValidators";

const MAX_NAME_MESSAGE = "Name must contain at most 255 characters";

function createValidationSchema(request: {
  applicationType: ApplicationType;
  ttsEngineName: string;
  sttEngineName: string;
}) {
  const { applicationType, ttsEngineName, sttEngineName } = request;

  return z.object({
    name: z.string().max(255, MAX_NAME_MESSAGE),
    type: z.nativeEnum(ApplicationType, {
      message: "Invalid application type"
    }),
    endpoint: hostOrHostPortSchema,
    textToSpeech: ttsEngineName
      ? z.object({
          productRef: z.string(),
          config: speechValidators.ttsConfigValidators[ttsEngineName]()
        })
      : z.undefined(),
    speechToText: sttEngineName
      ? z.object({
          productRef: z.string(),
          config: speechValidators.sttConfigValidators[sttEngineName]()
        })
      : z.undefined(),
    intelligence:
      applicationType === ApplicationType.AUTOPILOT
        ? z
            .object({
              productRef: z.string(),
              config: assistantWithoutApiKeySchema
            })
            .superRefine((data, ctx) => {
              const vendor = data.productRef.split(".")[1];
              const languageModelProvider = data.config.languageModel.provider;

              if (vendor !== languageModelProvider) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `intelligence.productRef (${data.productRef}) must match languageModel.provider (${languageModelProvider}).`,
                  path: ["productRef"]
                });
              }
            })
        : z.undefined()
  });
}

export { createValidationSchema };
