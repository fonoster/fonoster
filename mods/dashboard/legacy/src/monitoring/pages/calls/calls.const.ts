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
 * A list of searchable fields for filtering or querying calls.
 *
 * Each item represents a property that users can search against in the UI.
 * This configuration is commonly used to populate dropdowns, filters, or
 * search bars where the user selects which field to search by.
 */
export const CALLS_SEARCHABLE_FIELDS = [
  /**
   * Searchable by the call's unique reference ID.
   *
   * Typically a UUID or internal identifier.
   * Useful for precise lookups when the user knows the exact reference.
   */
  { label: "Reference", value: "ref" },

  /**
   * Searchable by the status of the call.
   *
   * Examples: "Completed", "Failed", "In Progress".
   */
  { label: "Status", value: "status" },

  /**
   * Searchable by the call direction.
   *
   * Examples: "Inbound" or "Outbound".
   */
  { label: "Direction", value: "direction" },

  /**
   * Searchable by the originating party of the call.
   *
   * Usually a phone number or SIP URI.
   */
  { label: "From", value: "from" },

  /**
   * Searchable by the destination party of the call.
   *
   * Usually a phone number or SIP URI.
   */
  { label: "To", value: "to" },

  /**
   * Searchable by the call type.
   *
   * Examples: "Voice", "Video".
   */
  { label: "Type", value: "type" },

  /**
   * Searchable by the call duration.
   *
   * Typically used for analyzing call length or filtering by duration.
   */
  { label: "Duration", value: "duration" }
];

// User-friendly mappings for display
export const STATUS_LABELS: Record<string, string> = Object.freeze({
  UNKNOWN: "Unknown",
  NORMAL_CLEARING: "Normal Clearing",
  CALL_REJECTED: "Call Rejected",
  UNALLOCATED: "Unallocated",
  NO_USER_RESPONSE: "No Response",
  NO_ROUTE_DESTINATION: "No Destination",
  NO_ANSWER: "No Answer",
  USER_BUSY: "User Busy",
  NOT_ACCEPTABLE_HERE: "Not Acceptable",
  SERVICE_UNAVAILABLE: "Service Unavailable",
  INVALID_NUMBER_FORMAT: "Invalid Number Format"
});
export const DIRECTION_LABELS: Record<string, string> = Object.freeze({
  INTRA_NETWORK: "Intra Network",
  FROM_PSTN: "From PSTN",
  TO_PSTN: "To PSTN"
});
export const TYPE_LABELS: Record<string, string> = Object.freeze({
  SIP_ORIGINATED: "SIP Originated",
  API_ORIGINATED: "API Originated"
});
