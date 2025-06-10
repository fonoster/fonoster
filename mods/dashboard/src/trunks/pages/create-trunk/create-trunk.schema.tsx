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
import { Transport } from "@fonoster/types";

/**
 * Zod validation schema for the Create Trunk form.
 *
 * Defines the expected structure and validation rules for creating a trunk.
 * Fields include:
 * - ref: Optional unique identifier.
 * - name: Required friendly name.
 * - sendRegister: Boolean to indicate if the trunk should send SIP REGISTER requests.
 * - inboundUri: Required string for inbound SIP traffic.
 * - ACLs and Credentials: Optional references.
 * - uris: Optional list of SIP URIs with detailed fields.
 */
export const schema = z.object({
  /**
   * Optional unique identifier for the trunk.
   * Typically a UUID or internal reference.
   */
  ref: z.string().nullish(),

  /**
   * Human-friendly name for the trunk (required).
   * Users will use this to identify the trunk in the UI.
   */
  name: z.string().nonempty("Friendly Name is required"),

  /**
   * Boolean flag to control SIP REGISTER behavior.
   * Indicates if the trunk should send SIP REGISTER requests.
   */
  sendRegister: z.boolean().optional(),

  /**
   * URI to handle inbound SIP traffic (required).
   */
  inboundUri: z.string().nonempty("Inbound URI is required"),

  /**
   * Optional references to ACL and credentials.
   * These are typically UUIDs or internal references.
   */
  accessControlListRef: z.string().optional(),
  inboundCredentialsRef: z.string().optional(),
  outboundCredentialsRef: z.string().optional(),

  /**
   * Optional list of SIP URIs for the trunk.
   * Each URI entry defines:
   *  - host: Required host.
   *  - port: Required positive integer.
   *  - transport: Enum value from the Transport type.
   *  - user: Optional username for authentication.
   *  - weight and priority: Non-negative integers used in SIP routing.
   *  - enabled: Boolean to enable/disable the URI.
   */
  uris: z
    .array(
      z.object({
        host: z.string().nonempty("Host is required"),
        port: z.coerce
          .number()
          .int()
          .positive("Port must be a positive integer"),
        transport: z.nativeEnum(Transport),
        user: z.string().optional(),
        weight: z.coerce
          .number()
          .int()
          .nonnegative("Weight must be a non-negative integer"),
        priority: z.coerce
          .number()
          .int()
          .nonnegative("Priority must be a non-negative integer"),
        enabled: z.boolean()
      })
    )
    .optional()
});

/**
 * Zod resolver for React Hook Form integration.
 * Ensures form validation is consistent and declarative.
 */
export const resolver = zodResolver(schema);

/**
 * Type representing the validated data structure from the form.
 * Useful for type-checking form state and submission handlers.
 */
export type Schema = z.infer<typeof schema>;
