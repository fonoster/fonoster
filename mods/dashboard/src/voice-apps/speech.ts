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
import type { Application } from "@fonoster/types";
import type { SelectOption } from "~/components/ui/select";

/**
 * Speech settings an EXTERNAL app may carry. The API validates them in
 * apiserver/src/applications/validation/speechValidators.ts: TTS config is
 * { voice } (required for Deepgram and Azure, optional for Google, free-form
 * for ElevenLabs); Deepgram STT config is { model?, languageCode? }.
 */

export const NONE = "none";

type Voice = { value: string; label: string };

const DEEPGRAM_VOICES: Voice[] = [
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

const ELEVENLABS_VOICES: Voice[] = [
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

// A curated subset of @fonoster/common's GoogleVoice / AzureVoice enums.
const GOOGLE_VOICES: Voice[] = [
  { value: "en-US-Neural2-C", label: "Neural2 C (en-us)" },
  { value: "en-US-Neural2-D", label: "Neural2 D (en-us)" },
  { value: "en-US-Neural2-F", label: "Neural2 F (en-us)" },
  { value: "en-US-Neural2-J", label: "Neural2 J (en-us)" },
  { value: "en-US-Standard-A", label: "Standard A (en-us)" },
  { value: "en-US-Standard-C", label: "Standard C (en-us)" },
  { value: "es-US-Neural2-A", label: "Neural2 A (es-us)" },
  { value: "es-US-Neural2-B", label: "Neural2 B (es-us)" },
  { value: "es-US-Neural2-C", label: "Neural2 C (es-us)" },
  { value: "es-US-Standard-A", label: "Standard A (es-us)" }
];

const AZURE_VOICES: Voice[] = [
  { value: "en-US-JennyNeural", label: "Jenny (en-us)" },
  { value: "en-US-GuyNeural", label: "Guy (en-us)" },
  { value: "en-US-AriaNeural", label: "Aria (en-us)" },
  { value: "es-ES-ElviraNeural", label: "Elvira (es-es)" },
  { value: "es-ES-AlvaroNeural", label: "Alvaro (es-es)" },
  { value: "es-MX-DaliaNeural", label: "Dalia (es-mx)" }
];

export const TTS_VENDORS: {
  productRef: string;
  name: string;
  voices: Voice[];
}[] = [
  { productRef: "tts.deepgram", name: "Deepgram", voices: DEEPGRAM_VOICES },
  {
    productRef: "tts.elevenlabs",
    name: "ElevenLabs",
    voices: ELEVENLABS_VOICES
  },
  { productRef: "tts.google", name: "Google", voices: GOOGLE_VOICES },
  { productRef: "tts.azure", name: "Azure", voices: AZURE_VOICES }
];

export const STT_MODELS: Voice[] = [
  { value: "nova-3", label: "nova-3" },
  { value: "nova-2", label: "nova-2" },
  { value: "nova-2-phonecall", label: "nova-2-phonecall" },
  { value: "nova-2-conversationalai", label: "nova-2-conversationalai" }
];

export const LANGUAGES: Voice[] = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-MX", label: "Spanish (Mexico)" },
  { value: "es-419", label: "Spanish (Latin America)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "fr-FR", label: "French" },
  { value: "multi", label: "Multilingual (nova-3 or nova-2)" }
];

/** Deepgram's code-switching mode only works with these models. */
export const MULTILINGUAL_MODELS = ["nova-3", "nova-2"];

const SEP = "|";

/** "tts.deepgram|aura-2-diana-es" ↔ { productRef, voice }. */
export function voiceKey(productRef: string, voice: string) {
  return `${productRef}${SEP}${voice}`;
}

export function parseVoiceKey(key: string) {
  const [productRef, ...rest] = key.split(SEP);
  return { productRef, voice: rest.join(SEP) };
}

function vendorName(productRef: string) {
  return (
    TTS_VENDORS.find((v) => v.productRef === productRef)?.name ??
    productRef.replace(/^(tts|stt)\./, "")
  );
}

function voiceLabel(productRef: string, voice: string) {
  const known = TTS_VENDORS.find(
    (v) => v.productRef === productRef
  )?.voices.find((v) => v.value === voice);
  // "Aura 2 Diana (es-es)" reads as "Aura 2 Diana" next to the vendor.
  return known ? known.label.replace(/ \([^)]*\)$/, "") : voice;
}

/** The Voice select: none, then every vendor's voices. Keeps an unknown current value. */
export function voiceOptions(current?: string): SelectOption[] {
  const options: SelectOption[] = [
    { value: NONE, label: "None", description: "Your code doesn't speak" }
  ];
  for (const vendor of TTS_VENDORS) {
    for (const voice of vendor.voices) {
      options.push({
        value: voiceKey(vendor.productRef, voice.value),
        label: `${vendor.name} · ${voice.label}`
      });
    }
  }
  if (
    current &&
    current !== NONE &&
    !options.some((o) => o.value === current)
  ) {
    const { productRef, voice } = parseVoiceKey(current);
    options.push({
      value: current,
      label: `${vendorName(productRef)} · ${voice || "default"}`
    });
  }
  return options;
}

export function transcriberOptions(current?: string): SelectOption[] {
  const options: SelectOption[] = [
    { value: NONE, label: "None", description: "Your code doesn't listen" },
    ...STT_MODELS.map((m) => ({
      value: m.value,
      label: `Deepgram · ${m.label}`
    }))
  ];
  if (current && !options.some((o) => o.value === current)) {
    options.push({ value: current, label: `Deepgram · ${current}` });
  }
  return options;
}

export function languageOptions(current?: string): SelectOption[] {
  const options: SelectOption[] = LANGUAGES.map((l) => ({ ...l }));
  if (current && !options.some((o) => o.value === current)) {
    options.push({ value: current, label: current });
  }
  return options;
}

/** The form's view of an app's speech settings. */
export type SpeechValues = {
  /** NONE or a voiceKey(). */
  voice: string;
  /** NONE or a Deepgram model. */
  transcriber: string;
  language: string;
};

export const DEFAULT_SPEECH: SpeechValues = {
  voice: NONE,
  transcriber: NONE,
  language: "en-US"
};

export function speechFromApp(app: Application): SpeechValues {
  const tts = app.textToSpeech;
  const stt = app.speechToText;
  const ttsVoice =
    typeof tts?.config?.voice === "string" ? tts.config.voice : "";
  const model =
    typeof stt?.config?.model === "string" ? stt.config.model : "nova-3";
  const language =
    typeof stt?.config?.languageCode === "string"
      ? stt.config.languageCode
      : DEFAULT_SPEECH.language;
  return {
    voice: tts?.productRef ? voiceKey(tts.productRef, ttsVoice) : NONE,
    transcriber: stt?.productRef ? model : NONE,
    language
  };
}

/** The textToSpeech / speechToText parts of a create or update request. */
export function speechPayload(values: SpeechValues) {
  const payload: {
    textToSpeech?: { productRef: string; config: Record<string, unknown> };
    speechToText?: { productRef: string; config: Record<string, unknown> };
  } = {};
  if (values.voice && values.voice !== NONE) {
    const { productRef, voice } = parseVoiceKey(values.voice);
    payload.textToSpeech = { productRef, config: voice ? { voice } : {} };
  }
  if (values.transcriber && values.transcriber !== NONE) {
    payload.speechToText = {
      productRef: "stt.deepgram",
      config: { model: values.transcriber, languageCode: values.language }
    };
  }
  return payload;
}

/** "Aura 2 Diana · nova-3" for the list, or undefined when the app has neither. */
export function speechSummary(app: Application): string | undefined {
  const parts: string[] = [];
  const tts = app.textToSpeech;
  if (tts?.productRef) {
    const voice = typeof tts.config?.voice === "string" ? tts.config.voice : "";
    parts.push(
      voice ? voiceLabel(tts.productRef, voice) : vendorName(tts.productRef)
    );
  }
  const stt = app.speechToText;
  if (stt?.productRef) {
    const model = typeof stt.config?.model === "string" ? stt.config.model : "";
    parts.push(model || vendorName(stt.productRef));
  }
  return parts.length ? parts.join(" · ") : undefined;
}
