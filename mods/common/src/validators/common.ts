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
import { POSITIVE_INTEGER_MESSAGE, VALID_UUID } from "../messages";

const usernameSchema = z.string().regex(/^[a-z0-9._-]+$/, {
  message: "Must be a lowercase string and with no spaces."
});

const baseApiObjectSchema = z.object({
  ref: z.string().uuid({
    message: VALID_UUID
  })
});

const emptySchema = z.object({});

const listRequestSchema = z
  .object({
    pageSize: z
      .number()
      .int({
        message: POSITIVE_INTEGER_MESSAGE
      })
      .positive({
        message: POSITIVE_INTEGER_MESSAGE
      })
      .optional(),
    pageToken: z.string().optional()
  })
  .optional();

const nameSchema = z.string().min(1, { message: "Value required" });

export {
  baseApiObjectSchema,
  emptySchema,
  listRequestSchema,
  nameSchema,
  usernameSchema
};
