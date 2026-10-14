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
 * A list of searchable fields for filtering or querying applications.
 *
 * Each item represents a property that users can search against in the UI.
 * This configuration is commonly used to populate dropdowns, filters, or
 * search bars where the user selects which field to search by.
 */
export const APPS_SEARCHABLE_FIELDS = [
  /**
   * Searchable by the application's unique reference ID.
   * This is typically a UUID or internal identifier.
   * Useful for precise lookups when the user knows the exact reference.
   */
  { label: "Reference", value: "ref" },

  /**
   * Searchable by the application's name.
   * Useful for users trying to locate applications by their display name.
   */
  { label: "Name", value: "name" },

  /**
   * Searchable by the application's type.
   * Could include types such as "voice app", "IVR", or custom categories.
   */
  { label: "Type", value: "type" },

  /**
   * Searchable by the application's Text-to-Speech (TTS) engine.
   * Refers to the TTS provider configured in the application.
   */
  { label: "TTS", value: "textToSpeech.productRef" },

  /**
   * Searchable by the application's Speech-to-Text (STT) engine.
   * Refers to the STT provider used for transcribing voice input.
   */
  { label: "STT", value: "speechToText.productRef" }
];
