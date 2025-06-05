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
import { Role } from "@fonoster/types";

/**
 * Zod validation schema for the Create API Key form.
 *
 * Defines the expected structure and validation rules for the apiKey creation fields.
 * Fields include:
 * - ref: Optional string reference ID.
 * - role: Required string representing the apiKey's role.
 */
export const schema = z.object({
  /** Unique identifier for the apiKey (optional). */
  ref: z.string().nullish(),

  /** Human-friendly name for the apiKey (required). */
  role: z.nativeEnum(Role)
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
