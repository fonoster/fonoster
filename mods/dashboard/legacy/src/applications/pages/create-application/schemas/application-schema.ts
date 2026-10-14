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

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApplicationType } from "@fonoster/types";
import { conversationSettingsSchema } from "./conversation-settings-schema";
import { languageModelConfigSchema } from "./language-model-config-schema";
import { eventsHookSchema } from "./events-hook-schema";
import type { UseFormReturn } from "react-hook-form";

export const schema = z
  .object({
    ref: z.string().nullish(),
    name: z.string().nonempty(),
    type: z.nativeEnum(ApplicationType),
    endpoint: z.string().optional(),
    textToSpeech: z
      .object({
        productRef: z.string(),
        config: z.object({
          voice: z.string().optional()
        })
      })
      .optional(),
    speechToText: z
      .object({
        productRef: z.string(),
        config: z.object({
          model: z.string(),
          languageCode: z.string()
        })
      })
      .optional(),
    intelligence: z
      .object({
        productRef: z.string(),
        config: z.object({
          conversationSettings: conversationSettingsSchema,
          languageModel: languageModelConfigSchema,
          eventsHook: eventsHookSchema.optional()
        })
      })
      .optional()
  })
  // For AUTOPILOT applications, textToSpeech and speechToText are required
  .refine(
    (data) =>
      !(
        data.type === ApplicationType.AUTOPILOT &&
        (!data.textToSpeech || !data.speechToText)
      ),
    {
      message: "TTS and STT are required for AUTOPILOT"
    }
  );

/** Resolver to integrate Zod schema validation with React Hook Form. */
export const resolver = zodResolver(schema);

/** Type representing the validated data structure. */
export type Schema = z.infer<typeof schema>;
export type Form = UseFormReturn<Schema>;
