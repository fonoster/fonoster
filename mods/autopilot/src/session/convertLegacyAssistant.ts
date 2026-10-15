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
import { SessionAssistant, sessionAssistantSchema } from "./config";

// The one-time conversion of stored assistants at cutover (owner decision, rework-autopilot 5.3).
// It never writes anything itself: it returns the new config plus what the migration job must do
// around it (create a workspace Secret, a webhook endpoint, app audio filters) and notices for the
// workspace.

const PROVIDERS = ["openai", "groq", "ollama", "google", "anthropic"];
const PLACEHOLDER_KEYS = new Set(["", "your-api-key", "changeme", "xxx"]);

type Legacy = {
  conversationSettings?: Record<string, unknown> & {
    maxSpeechWaitTimeout?: number;
    vad?: unknown;
    transferOptions?: {
      phoneNumber: string;
      message: string;
      timeout?: number;
    };
  };
  languageModel?: Record<string, unknown> & {
    provider?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
  };
  eventsHook?: {
    url: string;
    events?: string[];
    headers?: Record<string, string>;
  };
  audioFilters?: unknown;
  testCases?: unknown;
};

export type AssistantConversion = {
  assistant: SessionAssistant;
  /** An inline key to store as a workspace Secret (the config no longer holds it). */
  secret?: { name: string; value: string };
  /** The retired eventsHook URL, for creating a workspace webhook endpoint. */
  webhook?: { url: string };
  /** Audio filters that now belong in the app's configuration. */
  appFilters?: unknown;
  notices: string[];
};

export function convertLegacyAssistant(
  old: Legacy,
  options: { assistantRef: string }
): AssistantConversion {
  const notices: string[] = [];
  const lm = { ...(old.languageModel ?? {}) };
  const cs = { ...(old.conversationSettings ?? {}) };
  const result: Omit<AssistantConversion, "assistant"> = { notices };

  const provider = String(lm.provider ?? "");
  if (!PROVIDERS.includes(provider))
    throw new Error(`unknown language model provider "${provider}"`);
  const model = `${provider}/${lm.model}`;

  if (
    typeof lm.apiKey === "string" &&
    !PLACEHOLDER_KEYS.has(lm.apiKey.trim())
  ) {
    result.secret = {
      name: `${provider}-${options.assistantRef}`,
      value: lm.apiKey
    };
    notices.push(
      `The ${provider} key moved out of the assistant into the workspace Secret "${result.secret.name}".`
    );
  }
  if (lm.baseUrl) {
    notices.push(
      `The custom model endpoint ${lm.baseUrl} was removed; endpoints now come from the provider registry.`
    );
  }

  if ((cs.maxSpeechWaitTimeout ?? 0) > 0) {
    notices.push(
      `maxSpeechWaitTimeout (${cs.maxSpeechWaitTimeout} ms) became patience "patient"; turn timing now comes from the gateway.`
    );
  }
  if (cs.vad !== undefined)
    notices.push(
      "VAD settings were removed; turn detection now runs in the gateway."
    );
  if (
    cs.transferOptions?.timeout !== undefined &&
    cs.transferOptions.timeout !== 30000
  ) {
    notices.push(
      `The transfer timeout (${cs.transferOptions.timeout} ms) is no longer configurable per assistant.`
    );
  }
  if (old.eventsHook?.url) {
    result.webhook = { url: old.eventsHook.url };
    notices.push(
      `Assistant webhooks are retired; create a workspace webhook for ${old.eventsHook.url} (call.started, call.ended, call_record.sealed).`
    );
  }
  if (old.audioFilters !== undefined) {
    result.appFilters = old.audioFilters;
    notices.push("Audio filters moved to the app's configuration.");
  }

  const { maxSpeechWaitTimeout, vad, transferOptions, ...settings } = cs;
  void vad;
  const assistant = sessionAssistantSchema.parse({
    conversationSettings: {
      ...settings,
      ...(transferOptions
        ? {
            transferOptions: {
              phoneNumber: transferOptions.phoneNumber,
              message: transferOptions.message
            }
          }
        : {}),
      ...((maxSpeechWaitTimeout ?? 0) > 0 ? { patience: "patient" } : {})
    },
    languageModel: {
      model,
      temperature: lm.temperature,
      maxTokens: lm.maxTokens,
      tools: lm.tools,
      knowledgeBase: lm.knowledgeBase
    },
    ...(old.testCases !== undefined ? { testCases: old.testCases } : {})
  });
  return { ...result, assistant };
}
