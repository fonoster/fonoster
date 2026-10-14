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
 * A list of searchable fields for filtering or querying numbers.
 *
 * Each item represents a property that users can search against in the UI.
 * This configuration is commonly used to populate dropdowns, filters, or
 * search bars where the user selects which field to search by.
 */
export const APPS_SEARCHABLE_FIELDS = [
  /**
   * Searchable by the number's unique reference ID.
   * Typically a UUID or internal identifier.
   * Useful for precise lookups when the user knows the exact reference.
   */
  { label: "Reference", value: "ref" },

  /**
   * Searchable by the number's name.
   * Useful for users trying to locate numbers by their display name.
   */
  { label: "Name", value: "name" },

  /**
   * Searchable by the telephone URL of the number.
   * Often a SIP URI or endpoint identifier.
   */
  { label: "Tel URL", value: "telUrl" },

  /**
   * Searchable by the application reference assigned to the number.
   * Useful for linking numbers to specific applications or services.
   */
  { label: "App Reference", value: "appRef" },

  /**
   * Searchable by the Agent Address of Record (AOR).
   * Represents the SIP endpoint or user responsible for the number.
   */
  { label: "Agent AOR", value: "agentAor" },

  /**
   * Searchable by the city where the number is registered.
   * Useful for filtering numbers by their geographic location.
   */
  { label: "City", value: "city" },

  /**
   * Searchable by the country name where the number is registered.
   * Helps users find numbers by country.
   */
  { label: "Country", value: "country" },

  /**
   * Searchable by the ISO country code (e.g., US, CA).
   * Useful for filtering by standardized country codes.
   */
  { label: "Country ISO Code", value: "countryIsoCode" },

  /**
   * Searchable by the trunk's reference ID.
   * Links a number to its underlying trunk configuration.
   */
  { label: "Trunk Reference", value: "trunk.ref" },

  /**
   * Searchable by the trunk's name.
   * Helps users find numbers by trunk associations.
   */
  { label: "Trunk Name", value: "trunk.name" }
];
