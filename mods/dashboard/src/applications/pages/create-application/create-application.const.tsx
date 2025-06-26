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
import { ApplicationType } from "@fonoster/types";
import type { Schema } from "./schemas/application-schema";
import { EventsHookAllowedEvents } from "./schemas/events-hook-schema";
import { LanguageModelProvider } from "./schemas/language-model-provider";

/**
 * List of available application types.
 * Used to populate select inputs or configuration options for different application categories.
 */
export const APPLICATION_TYPES = [
  { value: ApplicationType.EXTERNAL, label: "External" },
  { value: ApplicationType.AUTOPILOT, label: "Autopilot" }
];

/**
 * List of supported Text-to-Speech (TTS) vendors.
 * Useful for building dropdowns or vendor selectors.
 */
export const TTS_VENDORS = [
  { value: "tts.deepgram", label: "Deepgram" },
  { value: "tts.elevenlabs", label: "ElevenLabs" }
];

/**
 * List of available TTS voices.
 * Each voice is identified by a vendor-specific ID and a human-friendly label.
 */
export const TTS_ELEVENLABS_VOICES = [
  { value: "Sarah", label: "Sarah (en)" },
  { value: "Laura", label: "Laura (en)" },
  { value: "Charlie", label: "Charlie (en)" },
  { value: "George", label: "George (en)" },
  { value: "Callum", label: "Callum (en)" },
  { value: "Liam", label: "Liam (en)" },
  { value: "Charlotte", label: "Charlotte (en)" },
  { value: "Alice", label: "Alice (en)" },
  { value: "Matilda", label: "Matilda (en)" },
  { value: "Will", label: "Will (en)" },
  { value: "Jessica", label: "Jessica (en)" },
  { value: "Eric", label: "Eric (en)" },
  { value: "Chris", label: "Chris (en)" },
  { value: "Brian", label: "Brian (en)" },
  { value: "Daniel", label: "Daniel (en)" },
  { value: "Lily", label: "Lily (en)" },
  { value: "Bill", label: "Bill (en)" }
];

export const TTS_DEEPGRAM_VOICES = [
  { value: "aura-asteria-en", label: "Aura Asteria (en)" },
  { value: "aura-luna-en", label: "Aura Luna (en)" },
  { value: "aura-stella-en", label: "Aura Stella (en)" },
  { value: "aura-athena-en", label: "Aura Athena (en)" },
  { value: "aura-hera-en", label: "Aura Hera (en)" },
  { value: "aura-orion-en", label: "Aura Orion (en)" },
  { value: "aura-arcas-en", label: "Aura Arcas (en)" },
  { value: "aura-perseus-en", label: "Aura Perseus (en)" },
  { value: "aura-angus-en", label: "Aura Angus (en)" },
  { value: "aura-orpheus-en", label: "Aura Orpheus (en)" },
  { value: "aura-helios-en", label: "Aura Helios (en)" },
  { value: "aura-zeus-en", label: "Aura Zeus (en)" }
];

/**
 * List of supported Speech-to-Text (STT) vendors.
 * Allows for selecting the desired vendor integration.
 */
export const STT_VENDORS = [{ value: "stt.deepgram", label: "Deepgram" }];

/**
 * List of available STT models for the selected vendor.
 * Each model might have specific configurations or trade-offs in accuracy or speed.
 */
export const STT_MODELS = [
  { value: "nova-3", label: "Nova 3" },
  { value: "nova-2", label: "Nova 2" },
  { value: "nova-2-phonecall", label: "Nova 2 Phone Call" },
  { value: "nova-2-conversationalai", label: "Nova 2 Conversational AI" }
];

/**
 * List of supported languages.
 * Defines which language is used for voice applications or STT/TTS services.
 */
export const LANGUAGES = [
  { value: "en-US", label: "English" },
  { value: "es-ES", label: "Spanish" }
];

export const LANGUAGE_MODEL_PROVIDERS = [
  { value: LanguageModelProvider.OPENAI, label: "OpenAI" },
  { value: LanguageModelProvider.GROQ, label: "Groq" },
  { value: LanguageModelProvider.OLLAMA, label: "Ollama" },
  { value: LanguageModelProvider.GOOGLE, label: "Google" },
  { value: LanguageModelProvider.ANTHROPIC, label: "Anthropic" }
];

export const LANGUAGE_MODEL_OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" }
];

export const LANGUAGE_MODEL_GROQ_MODELS = [
  { value: "llama-3.3-70b-specdec", label: "Llama 3.3 70B SpecDec" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" }
];

export const LANGUAGE_MODEL_OLLAMA_MODELS = [
  { value: "llama3-groq-tool-use", label: "Llama 3 Groq Tool Use" }
];

export const LANGUAGE_MODEL_GOOGLE_MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  { value: "gemini-2.0-pro-exp-02-05", label: "Gemini 2.0 Pro Exp 02-05" }
];

export const LANGUAGE_MODEL_ANTHROPIC_MODELS = [
  { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet Latest" },
  { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku Latest" }
];

export const getLanguageModelModels = (provider: LanguageModelProvider) => {
  const modelsMap = {
    [LanguageModelProvider.OPENAI]: LANGUAGE_MODEL_OPENAI_MODELS,
    [LanguageModelProvider.GROQ]: LANGUAGE_MODEL_GROQ_MODELS,
    [LanguageModelProvider.OLLAMA]: LANGUAGE_MODEL_OLLAMA_MODELS,
    [LanguageModelProvider.GOOGLE]: LANGUAGE_MODEL_GOOGLE_MODELS,
    [LanguageModelProvider.ANTHROPIC]: LANGUAGE_MODEL_ANTHROPIC_MODELS
  };

  return modelsMap[provider] || [];
};

/**
 * Default initial values for the application creation form.
 * This object provides a starting point for the form fields,
 * ensuring all necessary fields are initialized.
 */
export const APPLICATIONS_DEFAULT_INITIAL_VALUES: Schema = {
  ref: null,
  name: "",
  type: ApplicationType.EXTERNAL,
  endpoint: "",
  textToSpeech: {
    productRef: "tts.elevenlabs",
    config: {
      voice: "aura_asteria_en"
    }
  },
  speechToText: {
    productRef: "stt.deepgram",
    config: {
      model: "nova-3",
      languageCode: "en-US"
    }
  },
  intelligence: {
    productRef: LanguageModelProvider.GOOGLE,
    config: {
      conversationSettings: {
        firstMessage: "Hello, how can I help you?",
        systemPrompt: "",
        goodbyeMessage: "Goodbye! Have a great day!",
        systemErrorMessage: "An error occurred. Please try again later.",
        transferOptions: {
          phoneNumber: "",
          message: "Please call this number for further assistance."
        },
        idleOptions: {
          message: "I haven't heard from you in a while. Are you still there?"
        }
      },
      languageModel: {
        provider: LanguageModelProvider.GOOGLE,
        model: "gemini-2.0-flash",
        temperature: 0.2,
        maxTokens: 240
      },
      eventsHook: {
        url: "",
        headers: {
          "Content-Type": "application/json"
        },
        events: [EventsHookAllowedEvents.ALL]
      }
    }
  }
};
