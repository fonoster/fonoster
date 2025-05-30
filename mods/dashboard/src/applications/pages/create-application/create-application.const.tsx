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
export const TTS_VENDORS = [{ value: "deepgram", label: "Deepgram" }];

/**
 * List of available TTS voices.
 * Each voice is identified by a vendor-specific ID and a human-friendly label.
 */
export const TTS_VOICES = [
  { value: "aura_asteria_en", label: "Aura Asteria (en)" }
];

/**
 * List of supported Speech-to-Text (STT) vendors.
 * Allows for selecting the desired vendor integration.
 */
export const STT_VENDORS = [{ value: "deepgram", label: "Deepgram" }];

/**
 * List of available STT models for the selected vendor.
 * Each model might have specific configurations or trade-offs in accuracy or speed.
 */
export const STT_MODELS = [{ value: "nova-2", label: "Nova 2" }];

/**
 * List of supported languages.
 * Defines which language is used for voice applications or STT/TTS services.
 */
export const LANGUAGES = [{ value: "en-US", label: "en-US" }];

/**
 * Default initial values for the application creation form.
 * This object provides a starting point for the form fields,
 * ensuring all necessary fields are initialized.
 */
export const APPLICATIONS_DEFAULT_INITIAL_VALUES = {
  ref: null,
  name: "",
  type: ApplicationType.EXTERNAL,
  endpoint: "",
  textToSpeech: {
    vendor: "deepgram",
    voice: "aura_asteria_en"
  },
  speechToText: {
    vendor: "deepgram",
    model: "nova-2",
    language: "en-US"
  }
};
