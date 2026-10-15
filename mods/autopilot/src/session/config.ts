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
import { toolSchema } from "@fonoster/common";
import { z } from "zod";

// The assistant config for the session engine (rework-autopilot A8, A11, A12). Strict: vendor
// credentials, vendor enums, VAD settings and the assistant webhook are rejected with messages
// pointing to where they moved.

const removed = (key: string, message: string) =>
  z
    .any()
    .optional()
    .superRefine((value, ctx) => {
      if (value !== undefined)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key}: ${message}`
        });
    });

export const sessionLanguageModelSchema = z
  .object({
    /** A catalog id such as "openai/gpt-4o-mini". */
    model: z
      .string()
      .regex(
        /^[a-z0-9-]+\/.+/,
        "model must be a catalog id like openai/gpt-4o-mini"
      ),
    temperature: z.number().min(0).max(2).default(0.4),
    maxTokens: z.number().int().positive().default(400),
    tools: z.array(toolSchema).default([]),
    provider: removed(
      "provider",
      "use a catalog id in model (for example openai/gpt-4o-mini)"
    ),
    apiKey: removed(
      "apiKey",
      "credentials come from the provider registry or workspace secrets"
    ),
    baseUrl: removed("baseUrl", "endpoints come from the provider registry")
  })
  .strict();

export const sessionConversationSettingsSchema = z
  .object({
    firstMessage: z.string().optional(),
    systemPrompt: z.string(),
    goodbyeMessage: z.string(),
    systemErrorMessage: z.string(),
    initialDtmf: z
      .string()
      .regex(/^[0-9*#]+$/)
      .optional(),
    maxSessionDuration: z
      .number()
      .int()
      .positive()
      .default(30 * 60 * 1000),
    transferOptions: z
      .object({ phoneNumber: z.string(), message: z.string() })
      .optional(),
    idleOptions: z
      .object({
        message: z.string(),
        timeout: z.number().int().positive().default(30000),
        maxTimeoutCount: z.number().int().positive().default(2)
      })
      .optional(),
    allowUserBargeIn: z.boolean().default(true),
    /** eager: prepare a reply on turn.likely_ended; patient: only on turn.ended. */
    patience: z.enum(["eager", "patient"]).default("eager"),
    /** Played with play() while thinking; the reply preempts it (A9). */
    filler: z.object({ url: z.string().url() }).optional(),
    /** Catalog ids overriding the app's speech defaults on every speak. */
    voice: z.string().optional(),
    language: z.string().optional(),
    vad: removed(
      "vad",
      "turn detection moved to the gateway (turn-taking configuration)"
    ),
    maxSpeechWaitTimeout: removed(
      "maxSpeechWaitTimeout",
      "turn detection moved to the gateway"
    )
  })
  .strict();

export const sessionAssistantSchema = z
  .object({
    conversationSettings: sessionConversationSettingsSchema,
    languageModel: sessionLanguageModelSchema,
    eventsHook: removed(
      "eventsHook",
      "assistant webhooks were retired; use workspace webhooks"
    ),
    audioFilters: removed(
      "audioFilters",
      "audio filters are part of the app's configuration"
    )
  })
  .strict();

export type SessionAssistant = z.infer<typeof sessionAssistantSchema>;
export type SessionConversationSettings =
  SessionAssistant["conversationSettings"];
export type SessionLanguageModel = SessionAssistant["languageModel"];
export type ToolDefinition = SessionLanguageModel["tools"][number];
