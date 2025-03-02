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
import { z } from "zod";
import { POSITIVE_INTEGER_MESSAGE } from "../../messages";
import { nameSchema, usernameSchema } from "../common";

const createAgentRequestSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  privacy: z.enum(["PRIVATE", "NONE"]).optional(),
  enabled: z.boolean().optional(),
  maxContacts: z
    .number()
    .positive({ message: POSITIVE_INTEGER_MESSAGE })
    .optional(),
  expires: z.number().positive({ message: POSITIVE_INTEGER_MESSAGE }).optional()
});

const updateAgentRequestSchema = z.object({
  name: nameSchema.optional(),
  privacy: z.enum(["PRIVATE", "NONE"]).optional(),
  enabled: z.boolean().optional(),
  maxContacts: z
    .number()
    .positive({ message: POSITIVE_INTEGER_MESSAGE })
    .optional(),
  expires: z.number().positive({ message: POSITIVE_INTEGER_MESSAGE }).optional()
});

export { createAgentRequestSchema, updateAgentRequestSchema };
