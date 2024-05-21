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
import { CallStatus, CallType, HangupCause } from "./types";

const ListCallsRequestSchema = z.object({
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
  type: z
    .enum([CallType.PROGRAMMABLE, CallType.SIP_TRUNKING], {
      message: "Invalid call type"
    })
    .optional()
    .nullable(),
  hangupCause: z
    .enum(
      [
        HangupCause.NORMAL_CLEARING,
        HangupCause.CALL_REJECTED,
        HangupCause.UNALLOCATED,
        HangupCause.NO_USER_RESPONSE,
        HangupCause.NO_ROUTE_DESTINATION,
        HangupCause.NO_ANSWER,
        HangupCause.USER_BUSY,
        HangupCause.NOT_ACCEPTABLE_HERE,
        HangupCause.SERVICE_UNAVAILABLE,
        HangupCause.INVALID_NUMBER_FORMAT
      ],
      { message: "Invalid hangup cause" }
    )
    .optional()
    .nullable(),
  status: z
    .enum(
      [
        CallStatus.QUEUED,
        CallStatus.RINGING,
        CallStatus.IN_PROGRESS,
        CallStatus.COMPLETED,
        CallStatus.FAILED,
        CallStatus.BUSY,
        CallStatus.NO_ANSWER,
        CallStatus.CANCELED,
        CallStatus.REJECTED,
        CallStatus.TIMEOUT,
        CallStatus.UNKNOWN
      ],
      { message: "Invalid call status" }
    )
    .optional()
    .nullable(),
  pageToken: z
    .string({ message: "The pageToken must be a string" })
    .optional()
    .nullable()
});

export { ListCallsRequestSchema };
