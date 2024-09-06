/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { ToolSchema } from "../tools/ToolSchema";

const ConversationSettingsSchema = z.object({
  firstMessage: z.string(),
  systemTemplate: z.string(),
  goodbyeMessage: z.string(),
  systemErrorMessage: z.string(),
  initialDtmf: z.string().optional().nullable(),
  transferOptions: z
    .object({
      enabled: z.boolean(),
      phoneNumber: z.string(),
      message: z.string()
    })
    .optional()
    .nullable(),
  idleOptions: z
    .object({
      enabled: z.boolean(),
      message: z.string(),
      timeout: z.number(),
      maxTimeoutCount: z.number()
    })
    .optional()
    .nullable()
});

const LanguageModelConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  temperature: z.number(),
  maxTokens: z.number(),
  knowledgeBase: z.array(
    z.object({
      type: z.enum(["s3", "file"]),
      title: z.string(),
      url: z.string()
    })
  ),
  tools: z.array(ToolSchema)
});

const AssistantSchema = z.object({
  conversationSettings: ConversationSettingsSchema,
  languageModel: LanguageModelConfigSchema
});

export {
  AssistantSchema,
  ConversationSettingsSchema,
  LanguageModelConfigSchema
};
