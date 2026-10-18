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
/**
 * What an agent can be built from: language model providers and models,
 * voices, transcriber models and languages. Mirrors the API's validators
 * (apiserver voice/tts, voice/stt) and the previous dashboard's lists.
 */
import type { SelectOption } from "~/components/ui/select";

export const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "groq", label: "Groq" },
  { value: "google", label: "Google" },
  { value: "anthropic", label: "Anthropic" },
  { value: "ollama", label: "Ollama" }
] as const satisfies readonly SelectOption[];

export type LlmProvider = (typeof LLM_PROVIDERS)[number]["value"];

export const LLM_MODELS: Record<LlmProvider, SelectOption[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" }
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" }
  ],
  google: [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
    { value: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" }
  ],
  anthropic: [
    { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    { value: "claude-opus-4-5", label: "Claude Opus 4.5" }
  ],
  // Self-hosted: any model the server has pulled.
  ollama: [
    { value: "llama3.1", label: "Llama 3.1" },
    { value: "qwen2.5", label: "Qwen 2.5" }
  ]
};

export const TTS_PROVIDERS = [
  { value: "tts.deepgram", label: "Deepgram" },
  { value: "tts.elevenlabs", label: "ElevenLabs" }
] as const satisfies readonly SelectOption[];

export type TtsProvider = (typeof TTS_PROVIDERS)[number]["value"];

export const DEEPGRAM_VOICES: SelectOption[] = [
  { value: "aura-2-thalia-en", label: "Aura 2 Thalia (en-us)" },
  { value: "aura-2-andromeda-en", label: "Aura 2 Andromeda (en-us)" },
  { value: "aura-2-helena-en", label: "Aura 2 Helena (en-us)" },
  { value: "aura-2-apollo-en", label: "Aura 2 Apollo (en-us)" },
  { value: "aura-2-arcas-en", label: "Aura 2 Arcas (en-us)" },
  { value: "aura-2-aries-en", label: "Aura 2 Aries (en-us)" },
  { value: "aura-2-amalthea-en", label: "Aura 2 Amalthea (en-ph)" },
  { value: "aura-2-asteria-en", label: "Aura 2 Asteria (en-us)" },
  { value: "aura-2-athena-en", label: "Aura 2 Athena (en-us)" },
  { value: "aura-2-atlas-en", label: "Aura 2 Atlas (en-us)" },
  { value: "aura-2-aurora-en", label: "Aura 2 Aurora (en-us)" },
  { value: "aura-2-callista-en", label: "Aura 2 Callista (en-us)" },
  { value: "aura-2-cora-en", label: "Aura 2 Cora (en-us)" },
  { value: "aura-2-cordelia-en", label: "Aura 2 Cordelia (en-us)" },
  { value: "aura-2-delia-en", label: "Aura 2 Delia (en-us)" },
  { value: "aura-2-draco-en", label: "Aura 2 Draco (en-gb)" },
  { value: "aura-2-electra-en", label: "Aura 2 Electra (en-us)" },
  { value: "aura-2-harmonia-en", label: "Aura 2 Harmonia (en-us)" },
  { value: "aura-2-hera-en", label: "Aura 2 Hera (en-us)" },
  { value: "aura-2-iris-en", label: "Aura 2 Iris (en-us)" },
  { value: "aura-2-juno-en", label: "Aura 2 Juno (en-us)" },
  { value: "aura-2-luna-en", label: "Aura 2 Luna (en-us)" },
  { value: "aura-2-maia-en", label: "Aura 2 Maia (en-us)" },
  { value: "aura-2-nova-en", label: "Aura 2 Nova (en-us)" },
  { value: "aura-2-orion-en", label: "Aura 2 Orion (en-us)" },
  { value: "aura-2-pandora-en", label: "Aura 2 Pandora (en-gb)" },
  { value: "aura-2-phoebe-en", label: "Aura 2 Phoebe (en-us)" },
  { value: "aura-2-pluto-en", label: "Aura 2 Pluto (en-us)" },
  { value: "aura-2-saturn-en", label: "Aura 2 Saturn (en-us)" },
  { value: "aura-2-selene-en", label: "Aura 2 Selene (en-us)" },
  { value: "aura-2-theia-en", label: "Aura 2 Theia (en-au)" },
  { value: "aura-2-vesta-en", label: "Aura 2 Vesta (en-us)" },
  { value: "aura-2-zeus-en", label: "Aura 2 Zeus (en-us)" },
  { value: "aura-2-celeste-es", label: "Aura 2 Celeste (es-co)" },
  { value: "aura-2-estrella-es", label: "Aura 2 Estrella (es-mx)" },
  { value: "aura-2-nestor-es", label: "Aura 2 Nestor (es-es)" },
  { value: "aura-2-sirio-es", label: "Aura 2 Sirio (es-mx)" },
  { value: "aura-2-carina-es", label: "Aura 2 Carina (es-es)" },
  { value: "aura-2-alvaro-es", label: "Aura 2 Alvaro (es-es)" },
  { value: "aura-2-diana-es", label: "Aura 2 Diana (es-es)" },
  { value: "aura-2-aquila-es", label: "Aura 2 Aquila (es-419)" },
  { value: "aura-2-selena-es", label: "Aura 2 Selena (es-419)" },
  { value: "aura-2-javier-es", label: "Aura 2 Javier (es-mx)" },
  { value: "aura-asteria-en", label: "Aura Asteria (en-us)" },
  { value: "aura-luna-en", label: "Aura Luna (en-us)" },
  { value: "aura-stella-en", label: "Aura Stella (en-us)" },
  { value: "aura-athena-en", label: "Aura Athena (en-gb)" },
  { value: "aura-hera-en", label: "Aura Hera (en-us)" },
  { value: "aura-orion-en", label: "Aura Orion (en-us)" },
  { value: "aura-arcas-en", label: "Aura Arcas (en-us)" },
  { value: "aura-perseus-en", label: "Aura Perseus (en-us)" },
  { value: "aura-angus-en", label: "Aura Angus (en-ie)" },
  { value: "aura-orpheus-en", label: "Aura Orpheus (en-us)" },
  { value: "aura-helios-en", label: "Aura Helios (en-gb)" },
  { value: "aura-zeus-en", label: "Aura Zeus (en-us)" }
];

export const ELEVENLABS_VOICES: SelectOption[] = [
  { value: "EXAVITQu4vr4xnSDxMaL", label: "Sarah (en-us)" },
  { value: "FGY2WhTYpPnrIDTdsKH5", label: "Laura (en-us)" },
  { value: "IKne3meq5aSn9XLyUdCD", label: "Charlie (en-au)" },
  { value: "JBFqnCBsd6RMkjVDRZzb", label: "George (en-gb)" },
  { value: "N2lVS1w4EtoT3dr4eOWO", label: "Callum (en-gb)" },
  { value: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam (en-us)" },
  { value: "Xb7hH8MSUJpSbSDYk0k2", label: "Alice (en-gb)" },
  { value: "XrExE9yKIg1WjnnlVkGX", label: "Matilda (en-us)" },
  { value: "bIHbv24MWmeRgasZH58o", label: "Will (en-us)" },
  { value: "cgSgspJ2msm6clMCkdW9", label: "Jessica (en-us)" },
  { value: "cjVigY5qzO86Huf0OWal", label: "Eric (en-us)" },
  { value: "iP95p4xoKVk53GoZ742B", label: "Chris (en-us)" },
  { value: "nPczCjzI2devNBz1zQrb", label: "Brian (en-us)" },
  { value: "onwK4e9ZLuTAKqWW03F9", label: "Daniel (en-gb)" },
  { value: "pFZP5JQG7iQjIQuC4Bku", label: "Lily (en-gb)" },
  { value: "pqHfZKP75CvOlQylNhV4", label: "Bill (en-us)" }
];

export function voicesFor(provider: string): SelectOption[] {
  return provider === "tts.elevenlabs" ? ELEVENLABS_VOICES : DEEPGRAM_VOICES;
}

export const STT_MODELS: SelectOption[] = [
  { value: "nova-3", label: "Nova 3" },
  { value: "nova-2", label: "Nova 2" },
  { value: "nova-2-phonecall", label: "Nova 2 Phone Call" },
  { value: "nova-2-conversationalai", label: "Nova 2 Conversational AI" }
];

/** Deepgram's code-switching mode works with these models only. */
export const MULTILINGUAL_MODELS = ["nova-3", "nova-2"];

export type Language = SelectOption & {
  /** The Deepgram voice picked for agents created in this language. */
  voice: string;
  /** Prompts for templates: Spanish for es-*, English otherwise. */
  locale: "en" | "es";
};

export const LANGUAGES: Language[] = [
  {
    value: "en-US",
    label: "English (US) · en-US",
    voice: "aura-2-thalia-en",
    locale: "en"
  },
  {
    value: "en-GB",
    label: "English (UK) · en-GB",
    voice: "aura-2-draco-en",
    locale: "en"
  },
  {
    value: "es-419",
    label: "Spanish (Latin America) · es-419",
    voice: "aura-2-celeste-es",
    locale: "es"
  },
  {
    value: "es-MX",
    label: "Spanish (Mexico) · es-MX",
    voice: "aura-2-estrella-es",
    locale: "es"
  },
  {
    value: "es-ES",
    label: "Spanish (Spain) · es-ES",
    voice: "aura-2-diana-es",
    locale: "es"
  },
  {
    value: "multi",
    label: "Multilingual (English + Spanish) · multi",
    voice: "aura-2-celeste-es",
    locale: "es"
  }
];

export function languageOf(code: string): Language | undefined {
  return LANGUAGES.find((language) => language.value === code);
}

/** "Aura 2 Celeste (es-co)" → "Aura 2 Celeste"; unknown ids pass through. */
export function voiceName(provider: string, voice: string): string {
  const option = voicesFor(provider).find((v) => v.value === voice);
  return option ? option.label.replace(/\s*\([^)]*\)$/, "") : voice;
}

export function providerLabel(
  options: readonly SelectOption[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
