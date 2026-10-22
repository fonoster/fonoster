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
import { toolSchema } from "./tools";

// The agent config for the rebuilt Autopilot (rework-autopilot A8, A11, A12; tasks 5.1, 5.2,
// 5.4). Strict: vendor credentials, vendor enums, VAD settings and the agent webhook are
// rejected with messages pointing to where they moved. It is the only agent schema: the legacy
// one was deleted after the cutover job converts stored agents (rework-autopilot 8.2).

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
    /** Documents for the knowledge port (same shape as before; wired by the operator). */
    knowledgeBase: z
      .array(
        z.object({
          type: z.enum(["s3"]),
          title: z.string(),
          document: z.string()
        })
      )
      .default([]),
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
      .object({
        phoneNumber: z.string(),
        message: z.string(),
        /** Said when the transfer fails, before the conversation goes on (default in Autopilot). */
        failedMessage: z.string().optional()
      })
      .optional(),
    idleOptions: z
      .object({
        message: z.string(),
        timeout: z.number().int().positive().default(30000),
        maxTimeoutCount: z.number().int().positive().default(2)
      })
      .optional(),
    allowUserBargeIn: z.boolean().default(true),
    /**
     * The turn-taking patience knob (TT-B5): sent to AppBridge with listen.update so its Pacing
     * policy waits less (low) or more (high) before turn.ended. Autopilot prepares a reply on
     * turn.likely_ended at low and normal, and only on turn.ended at high.
     */
    patience: z.enum(["low", "normal", "high"]).default("normal"),
    /** Words to bias speech recognition toward (names, brands), sent with listen.update. */
    hints: z.array(z.string().min(1)).max(100).optional(),
    /** Played with play() while thinking; the reply preempts it (A9). */
    filler: z.object({ url: z.string().url() }).optional(),
    /** Catalog ids overriding the app's speech defaults on every speak. */
    voice: z.string().optional(),
    language: z.string().optional(),
    vad: removed(
      "vad",
      "turn detection moved to AppBridge (turn-taking configuration)"
    ),
    maxSpeechWaitTimeout: removed(
      "maxSpeechWaitTimeout",
      "turn detection moved to AppBridge"
    )
  })
  .strict();

export const sessionAgentSchema = z
  .object({
    conversationSettings: sessionConversationSettingsSchema,
    languageModel: sessionLanguageModelSchema,
    /** Conversation eval cases, kept as they were (evaluated outside calls). */
    testCases: z.any().optional(),
    eventsHook: removed(
      "eventsHook",
      "agent webhooks were retired; use workspace webhooks (conversation.ended → call.ended or call_record.sealed)"
    ),
    audioFilters: removed(
      "audioFilters",
      "audio filters are part of the app's configuration"
    )
  })
  .strict();

export type SessionAgent = z.infer<typeof sessionAgentSchema>;
export type SessionConversationSettings = SessionAgent["conversationSettings"];
export type SessionLanguageModel = SessionAgent["languageModel"];
export type ToolDefinition = SessionLanguageModel["tools"][number];
