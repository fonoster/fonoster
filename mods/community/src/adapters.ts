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
import { DeepgramSttAdapter, DeepgramTtsAdapter } from "./deepgram";
import { ElevenLabsTtsAdapter } from "./elevenlabs";
import { FakeSttAdapter, FakeTtsAdapter } from "./fake";
import { Think, ThinkProvider } from "./llm";
import { OPENAI_COMPATIBLE, OpenAiCompatibleThink } from "./openai";
import { SttAdapter, TtsAdapter } from "./speech";

// Adapters by catalog adapter id (add-provider-registry P2): a registry provider row names its
// `adapter`; AppBridge (speech) and Autopilot (LLM) build vendor clients through this table.

/** How a speech adapter is reached: key, endpoint override, provider model, timeout. */
export type SpeechAdapterOptions = {
  apiKey?: string;
  url?: string;
  model?: string;
  timeoutMs?: number;
};

export type LlmAdapterFactory = {
  /** The vendor's endpoint when the operator configures none. */
  defaultEndpoint?: string;
  create(
    provider: ThinkProvider,
    model: string,
    settings: { temperature: number; maxTokens: number; jsonMode?: boolean }
  ): Think;
};

export type AdapterFactories = {
  /** Works without a credential (fake, local models). */
  keyless?: boolean;
  /** Undefined when the options are not enough to reach the vendor. */
  tts?(options: SpeechAdapterOptions): TtsAdapter | undefined;
  stt?(options: SpeechAdapterOptions): SttAdapter | undefined;
  llm?: LlmAdapterFactory;
};

function openAiCompatible(adapter: string): LlmAdapterFactory {
  return {
    defaultEndpoint: OPENAI_COMPATIBLE[adapter],
    create: (provider, model, settings) =>
      new OpenAiCompatibleThink(provider, model, settings)
  };
}

export const ADAPTERS: Readonly<Record<string, AdapterFactories>> = {
  deepgram: {
    tts: (o) =>
      new DeepgramTtsAdapter({
        apiKey: o.apiKey ?? "",
        baseUrl: o.url,
        timeoutMs: o.timeoutMs
      }),
    stt: (o) =>
      new DeepgramSttAdapter({
        apiKey: o.apiKey ?? "",
        baseUrl: o.url,
        sttModel: o.model
      })
  },
  elevenlabs: {
    tts: (o) =>
      new ElevenLabsTtsAdapter({
        apiKey: o.apiKey ?? "",
        baseUrl: o.url,
        model: o.model,
        timeoutMs: o.timeoutMs
      })
  },
  openai: { llm: openAiCompatible("openai") },
  groq: { llm: openAiCompatible("groq") },
  ollama: { keyless: true, llm: openAiCompatible("ollama") },
  fake: {
    keyless: true,
    tts: (o) =>
      o.url
        ? new FakeTtsAdapter({ url: o.url, timeoutMs: o.timeoutMs ?? 3000 })
        : undefined,
    stt: (o) => (o.url ? new FakeSttAdapter({ url: o.url }) : undefined),
    llm: openAiCompatible("fake")
  }
};

/** The factories for a catalog adapter id, or undefined when this version has none. */
export function adapterFor(id: string): AdapterFactories | undefined {
  return Object.prototype.hasOwnProperty.call(ADAPTERS, id)
    ? ADAPTERS[id]
    : undefined;
}
