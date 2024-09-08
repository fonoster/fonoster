/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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

const createCallRequestSchema = z.object({
  from: z.string(),
  to: z.string(),
  appRef: z.string(),
  timeout: z.number().optional()
});

const getCallRequestSchema = z.object({
  ref: z.string({ message: "Invalid call reference" })
});

const listCallsRequestSchema = z.object({
  after: z
    .string()
    .datetime({ offset: true, message: "The date must be a valid ISO 8601" })
    .optional()
    .nullable(),
  before: z
    .string()
    .datetime({ offset: true, message: "The date must be a valid ISO 8601" })
    .optional()
    .nullable(),
  pageSize: z
    .number({ message: "Invalid pageSize value" })
    .optional()
    .nullable(),
  // type: z
  //   .nativeEnum(CallType, {
  //     message: "Invalid call type"
  //   })
  //   .optional()
  //   .nullable(),
  // status: z
  //   .nativeEnum(CallStatus, { message: "Invalid call status" })
  //   .optional()
  //   .nullable(),
  pageToken: z
    .string({ message: "The pageToken must be a string" })
    .optional()
    .nullable()
});

export {
  createCallRequestSchema,
  getCallRequestSchema,
  listCallsRequestSchema
};
