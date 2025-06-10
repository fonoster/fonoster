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
import { Privacy } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * Zod validation schema for the Create Agent form.
 *
 * This schema defines the expected structure and validation rules for creating or
 * updating an agent (SIP user) record. Each field is documented below with its
 * purpose and validation requirements.
 */
export const schema = z.object({
  /**
   * Unique identifier for the agent (optional).
   *
   * - Typically a UUID or internal reference string.
   * - Useful for distinguishing between new agents (no ref) and existing ones (ref present).
   * - Allows editing or referencing the agent programmatically.
   */
  ref: z.string().nullish(),

  /**
   * Human-friendly name for the agent (required).
   *
   * - This is what users see in the UI as the agent name.
   * - It cannot be empty to ensure meaningful identification.
   */
  name: z.string().nonempty("Friendly Name is required"),

  /**
   * Reference to the domain this agent belongs to (optional).
   *
   * - Often a UUID or internal reference.
   * - Allows linking the agent to a specific SIP domain.
   * - Can be left empty when creating an agent with no domain assignment yet.
   */
  domainRef: z.string().optional(),

  /**
   * Username associated with the agent (required).
   *
   * - Used for SIP authentication or system login.
   * - Must be non-empty to ensure that the agent can authenticate correctly.
   */
  username: z.string().nonempty("Username is required"),

  /**
   * Reference to the credentials associated with the agent (optional).
   *
   * - Often a UUID or internal reference to a credentials object.
   * - Useful for linking the agent with predefined SIP credentials or secrets.
   */
  credentialsRef: z.string().optional(),

  /**
   * Boolean indicating whether the agent is enabled.
   *
   * - True means the agent is active and can register/authenticate.
   * - False means the agent is disabled (cannot register).
   */
  enabled: z.boolean(),

  /**
   * Privacy setting for the agent.
   *
   * - Enum type that matches the `Privacy` values from @fonoster/types.
   * - Typically determines how caller ID or other SIP privacy features are applied.
   */
  privacy: z.nativeEnum(Privacy),

  /**
   * Maximum number of simultaneous contacts (registrations) allowed.
   *
   * - Must be an integer between 1 and 100.
   * - Ensures load and resource constraints are respected.
   */
  maxContacts: z.coerce
    .number()
    .int()
    .min(1, "Max Contacts must be at least 1")
    .max(100, "Max Contacts cannot exceed 100"),

  /**
   * Expiration time for the agent's registration.
   *
   * - Specifies how long the agent's registration is valid before needing renewal.
   * - Must be an integer representing seconds, with a minimum of 60 seconds.
   * - Helps manage resource usage and ensures stale registrations are cleaned up.
   */
  expires: z.coerce
    .number()
    .int()
    .min(60, "Expires must be at least 60 seconds")
});

/**
 * Resolver to integrate the Zod schema validation with React Hook Form.
 *
 * - This bridges Zod with React Hook Form, ensuring form submissions are validated automatically.
 * - Helps show user-friendly error messages in the UI.
 */
export const resolver = zodResolver(schema);

/**
 * Type representing the validated data structure returned by the schema.
 *
 * - This type is helpful for typing the form state, submission handlers, and component props.
 * - Keeps the developer experience consistent and type-safe.
 */
export type Schema = z.infer<typeof schema>;
