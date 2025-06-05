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
 * List of supported countries.
 *
 * Defines which countries are available for assignment
 * when creating or configuring numbers. This list can be
 * used to populate dropdowns or select inputs in the UI.
 */
export const COUNTRIES = [
  /**
   * United States (USA)
   */
  { value: "US", label: "United States" },

  /**
   * Canada (CAN)
   */
  { value: "CAN", label: "Canada" },

  /**
   * Mexico (MEX)
   */
  { value: "MEX", label: "Mexico" },

  /**
   * Brazil (BRA)
   */
  { value: "BRA", label: "Brazil" }
];

/**
 * Default initial values for the number creation/editing form.
 *
 * Provides a consistent starting point for form fields, ensuring
 * all necessary properties are initialized to avoid uncontrolled state errors.
 */
export const NUMBERS_DEFAULT_INITIAL_VALUES = {
  /**
   * Unique identifier reference for the number.
   * Typically assigned by the backend upon creation.
   */
  ref: null,

  /**
   * Human-readable name of the number.
   * Used to identify the number in the UI.
   */
  name: "",

  /**
   * Reference to the trunk configuration associated with the number.
   * Links the number to a specific SIP trunk for routing.
   */
  trunkRef: "",

  /**
   * Country where the number is registered or assigned.
   * This is a textual representation (e.g., "USA", "CAN").
   */
  country: "",

  /**
   * ISO country code for the number.
   * Typically a 2-letter or 3-letter standardized code.
   */
  countryIsoCode: "",

  /**
   * City where the number is assigned.
   * Provides additional location context.
   */
  city: "",

  /**
   * The SIP or telephone URL for the number.
   * Used for routing calls.
   */
  telUrl: "",

  /**
   * Reference to the application associated with this number.
   * Useful for linking numbers to specific services or features.
   */
  appRef: "",

  /**
   * Agent AOR (Address of Record).
   * Represents the SIP endpoint or user that handles calls to this number.
   */
  agentAor: ""
};
