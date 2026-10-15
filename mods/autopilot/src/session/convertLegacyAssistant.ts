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

/**
 * VAD-era settings → the patience knob (add-turn-taking 3.2, AP-B3). maxSpeechWaitTimeout was
 * extra waiting after the caller's speech before answering; 0 (the old default) is today's
 * behaviour, normal. Any extra wait becomes high (about 1.6 × the gateway's silence timeout, and
 * more as the gateway adapts to a caller who pauses). Nothing maps to low: the old settings had
 * no way to answer faster than the default. allowUserBargeIn keeps its meaning: it sets
 * `interruptible` on every speak and whether Autopilot sends clear on turn.user_started.
 */
export function patienceFor(
  maxSpeechWaitTimeout?: number
): "low" | "normal" | "high" {
  return (maxSpeechWaitTimeout ?? 0) > 0 ? "high" : "normal";
}

const DEFAULT_VAD = {
  activationThreshold: 0.4,
  deactivationThreshold: 0.25,
  debounceFrames: 4
};

function isDefaultVad(vad: unknown): boolean {
  if (!vad || typeof vad !== "object") return true;
  const v = vad as Record<string, unknown>;
  return (Object.keys(DEFAULT_VAD) as (keyof typeof DEFAULT_VAD)[]).every(
    (k) => v[k] === undefined || v[k] === DEFAULT_VAD[k]
  );
}

export type AssistantConversion = {
  assistant: SessionAssistant;
  /**
   * An inline key to store as the workspace's key for `providerId` (the config no longer holds
   * it). The migration job binds it like the dashboard's Vendor keys page does (a Secret named
   * `provider-key/<provider>` in workspace_provider_keys), which is where the registry's
   * credentialRef lookup finds workspace keys (AP-B4, LG-B1).
   */
  secret?: { providerId: string; name: string; value: string };
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
    void options.assistantRef;
    result.secret = {
      providerId: provider,
      name: `provider-key/${provider}`,
      value: lm.apiKey
    };
    notices.push(
      `The ${provider} key moved out of the assistant into the workspace's ${provider} vendor key (Secret "${result.secret.name}").`
    );
  }
  if (lm.baseUrl) {
    notices.push(
      `The custom model endpoint ${lm.baseUrl} was removed; endpoints now come from the provider registry.`
    );
  }

  const patience = patienceFor(cs.maxSpeechWaitTimeout);
  if (patience !== "normal") {
    notices.push(
      `maxSpeechWaitTimeout (${cs.maxSpeechWaitTimeout} ms) became patience "${patience}"; turn timing now comes from the gateway.`
    );
  }
  if (cs.vad !== undefined && !isDefaultVad(cs.vad))
    notices.push(
      "Custom VAD settings were removed; turn detection now runs in the gateway. For noisy lines use the app's audio filters or a more patient setting."
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
  void maxSpeechWaitTimeout;
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
      ...(patience !== "normal" ? { patience } : {})
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
