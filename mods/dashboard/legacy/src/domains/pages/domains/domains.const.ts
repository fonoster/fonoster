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
 * A list of searchable fields for filtering or querying domains.
 *
 * This configuration is typically used to populate:
 * - Dropdown menus in the UI
 * - Filter panels
 * - Search bars
 *
 * Each item in this array represents a field in the Domain entity
 * that users can search against when managing or browsing domain records.
 */
export const DOMAINS_SEARCHABLE_FIELDS = [
  {
    /**
     * Searchable by the domain's unique reference ID.
     *
     * - Typically a UUID or an internal identifier.
     * - Useful for precise lookups when the user knows the exact reference.
     * - Helps with direct search or linking between records.
     */
    label: "Reference",
    value: "ref"
  },

  {
    /**
     * Searchable by the domain's name.
     *
     * - A human-readable identifier for the domain.
     * - Useful for users who remember the name of the domain they are looking for.
     */
    label: "Name",
    value: "name"
  },

  {
    /**
     * Searchable by the domain's URI.
     *
     * - Typically in the format: sip:domain.example.com.
     * - Allows users to search based on the SIP address or domain.
     */
    label: "Domain URI",
    value: "domainUri"
  },

  {
    /**
     * Searchable by the domain's Access Control List reference.
     *
     * - Links the domain to its associated ACL.
     * - Allows users to filter domains by the ACL they are assigned to.
     */
    label: "Access Control List Ref",
    value: "accessControlListRef"
  }
];
