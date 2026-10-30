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

// A ListCalls number filter is an exact match against the index's stored `from`/`to` (whatever the
// call carried: an E.164 number, a SIP URI with parameters, a display-name caller ID). It never
// reaches SIP, so it is a bounded search string: at most 256 characters, no control characters.
// Empty or unset means no filter (proto3 sends "").
const MAX_NUMBER_FILTER_LENGTH = 256;
const numberFilterSchema = z
  .string()
  .max(MAX_NUMBER_FILTER_LENGTH, {
    message: `Must be at most ${MAX_NUMBER_FILTER_LENGTH} characters`
  })
  // eslint-disable-next-line no-control-regex
  .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), {
    message: "Must not contain control characters"
  });

// `from` is one of the workspace's Numbers (the Calls service checks ownership); it travels as
// X-Dod-Number and picks the trunk, so it is an E.164 number. `to` is what the Roomr node dials.
const createCallRequestSchema = z.object({
  from: e164Schema,
  to: sipTargetSchema,
  appRef: z.string().guid({ message: "Invalid call reference" }),
  timeout: z
    .number()
    .max(120, { message: "Timeout must be less than 120s" })
    .default(30),
  metadata: z.record(z.string(), z.any()).optional()
});

const getCallRequestSchema = z.object({
  ref: z.string().guid({ message: "Invalid call reference" })
});

const listCallsRequestSchema = z.object({
  after: z.string().datetime({ offset: true, message: VALID_DATE }).optional(),
  before: z.string().datetime({ offset: true, message: VALID_DATE }).optional(),
  from: numberFilterSchema.optional(),
  to: numberFilterSchema.optional(),
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
    .refine((v) => v === "" || z.string().guid().safeParse(v).success, {
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
