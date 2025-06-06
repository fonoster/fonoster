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
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * Zod validation schema for the Create Domain form.
 *
 * This schema defines the structure and validation rules for the domain creation fields:
 * - ref: Optional string reference ID (useful for internal linking or editing).
 * - name: Required, non-empty string (used as the domain's friendly name).
 * - accessControlListRef: Optional reference to the associated ACL.
 * - egressPolicies: Optional array of egress policy objects, each containing:
 *    - rule: Required string describing the egress policy (e.g., IP/CIDR).
 *    - numberRef: Required string linking the policy to a specific number.
 *
 * This ensures that:
 * - Domain names are always present and non-empty.
 * - ACL references can be attached or omitted.
 * - Egress policies, if provided, follow a strict structure.
 */
export const schema = z.object({
  /**
   * Unique identifier for the domain.
   *
   * Typically a UUID or internal reference.
   * Optional — usually set by the system when editing an existing domain.
   */
  ref: z.string().nullish(),

  /**
   * Human-friendly name for the domain.
   *
   * Required — helps users easily identify the domain in the UI.
   */
  name: z.string().nonempty("Friendly Name is required"),

  /**
   * URI for the domain.
   *
   * This should be a valid URL that points to the domain's resources or services.
   * Required — ensures the domain can be accessed programmatically.
   */
  domainUri: z
    .string()
    .nonempty("Domain URI is required")
    .regex(
      /^(https?:\/\/)?([\w.-]+)(:[0-9]+)?(\/[\w.-]*)*\/?$/,
      "Domain URI must be a valid URL"
    )
    .transform((val) => val.trim()),

  /**
   * Reference to the domain's Access Control List (ACL).
   *
   * Optional — allows linking the domain to a specific ACL for security.
   */
  accessControlListRef: z.string().optional(),

  /**
   * List of egress policies associated with the domain.
   *
   * Each policy defines:
   * - A rule (e.g., an IP range or CIDR block).
   * - A reference to a number that enforces this policy.
   *
   * Optional — allows fine-grained control over outbound call routing.
   */
  egressPolicies: z
    .array(
      z.object({
        /**
         * The egress rule itself.
         *
         * Required — defines the condition for outbound calls (e.g., "0.0.0.0/0").
         */
        rule: z
          .string()
          .regex(/^[^:]+$/, "Rule cannot contain ':' character")
          .nonempty("Rule is required"),

        /**
         * Reference to the number enforcing this egress rule.
         *
         * Required — must point to an existing number in the system.
         */
        numberRef: z.string().nonempty("Number Reference is required")
      })
    )
    .optional()
});

/**
 * Resolver to integrate the Zod schema with React Hook Form.
 *
 * This ensures consistent, declarative form validation using Zod.
 */
export const resolver = zodResolver(schema);

/**
 * Type representing the validated data structure returned by the schema.
 *
 * Useful for:
 * - Typing form state in React Hook Form.
 * - Typing submission handlers and services consuming this data.
 */
export type Schema = z.infer<typeof schema>;
