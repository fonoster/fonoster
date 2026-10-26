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
import { CallStatus, CallType } from "@fonoster/types";
import { z } from "zod";
import { POSITIVE_INTEGER_MESSAGE, VALID_DATE } from "../messages";
import { e164Schema, sipTargetSchema } from "./sip";

// `from` is one of the workspace's Numbers (the Calls service checks ownership); it travels as
// X-Dod-Number and picks the trunk, so it is an E.164 number. `to` is what the Roomr node dials.
const createCallRequestSchema = z.object({
  from: e164Schema,
  to: sipTargetSchema,
  appRef: z.string().uuid({ message: "Invalid call reference" }),
  timeout: z
    .number()
    .max(120, { message: "Timeout must be less than 120s" })
    .default(30),
  metadata: z.record(z.string(), z.any()).optional()
});

const getCallRequestSchema = z.object({
  ref: z.string().uuid({ message: "Invalid call reference" })
});

const listCallsRequestSchema = z.object({
  after: z.string().datetime({ offset: true, message: VALID_DATE }).optional(),
  before: z.string().datetime({ offset: true, message: VALID_DATE }).optional(),
  // Empty or unset means no filter; anything else must be a number or SIP target, as CreateCall takes.
  from: z.union([z.literal(""), sipTargetSchema]).optional(),
  to: z.union([z.literal(""), sipTargetSchema]).optional(),
  pageSize: z
    .number()
    .int({
      message: POSITIVE_INTEGER_MESSAGE
    })
    .positive({
      message: POSITIVE_INTEGER_MESSAGE
    })
    .optional(),
  type: z
    .nativeEnum(CallType, {
      message: "Invalid call type"
    })
    .optional(),
  status: z
    .nativeEnum(CallStatus, { message: "Invalid call status" })
    .optional(),
  // Empty or unset means no filter (proto3 sends ""); anything else must be an app ref.
  appRef: z
    .string()
    .refine((v) => v === "" || z.string().uuid().safeParse(v).success, {
      message: "Invalid application reference"
    })
    .optional(),
  pageToken: z.string().optional()
});

export {
  createCallRequestSchema,
  getCallRequestSchema,
  listCallsRequestSchema
};
