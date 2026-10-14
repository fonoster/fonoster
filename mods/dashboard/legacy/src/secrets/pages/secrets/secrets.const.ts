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
 * A list of searchable fields for filtering or querying secrets.
 *
 * Each item represents a property that users can search against in the UI.
 * This configuration is commonly used to populate dropdowns, filters, or
 * search bars where the user selects which field to search by.
 */
export const SECRETS_SEARCHABLE_FIELDS = [
  /**
   * Searchable by the secret's unique reference ID.
   * Typically a UUID or internal identifier.
   * Useful for precise lookups when the user knows the exact reference.
   */
  { label: "Reference", value: "ref" },

  /**
   * Searchable by the secret's name.
   * This is a human-readable identifier for the secret.
   * Useful for users who remember the name of the secret
   * they are looking for.
   */
  { label: "Name", value: "name" }
];
