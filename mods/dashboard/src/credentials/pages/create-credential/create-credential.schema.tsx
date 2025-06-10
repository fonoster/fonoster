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
 * Zod validation schema for the Create Credential form.
 *
 * Defines the expected structure and validation rules for the credential creation fields.
 * Fields include:
 * - ref: Optional string reference ID.
 * - name: Required string, cannot be empty (friendly name).
 * - username: Required string, cannot be empty (username).
 * - password: Optional password field validated by PASSWORD_SCHEMA.
 */
export const schema = z.object({
  /** Unique identifier for the credential (optional). */
  ref: z.string().nullish(),

  /** Human-friendly name for the credential (required). */
  name: z.string().nonempty("Friendly Name is required"),

  /** Username associated with the credential (required). */
  username: z.string().nonempty("Username is required"),

  /** Password field validated by PASSWORD_SCHEMA (optional). */
  password: z.string().nonempty()
});

/**
 * Resolver to integrate the Zod schema validation with React Hook Form.
 *
 * This ensures form validation is handled consistently and declaratively.
 */
export const resolver = zodResolver(schema);

/**
 * Type representing the validated data structure returned by the schema.
 *
 * This type is useful for typing the form state, handlers, and submissions.
 */
export type Schema = z.infer<typeof schema>;
