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
import { CallStatus } from "@fonoster/types";

/** Failure reasons of a call record → the Calls API's CallStatus names. */
const FAILURE_STATUS: Record<string, CallStatus> = {
  busy: CallStatus.USER_BUSY,
  no_answer: CallStatus.NO_ANSWER,
  rejected: CallStatus.CALL_REJECTED,
  no_app: CallStatus.NO_ROUTE_DESTINATION
};

/**
 * Why a failed call ended, as a CallStatus: what GetCall and ListCalls report for it and what
 * TrackCall ends its stream with. Any other reason (node_error, removed, canceled, a call that
 * never got placed) is SERVICE_UNAVAILABLE.
 */
export function failureStatus(reason?: string | null): CallStatus {
  return FAILURE_STATUS[reason ?? ""] ?? CallStatus.SERVICE_UNAVAILABLE;
}
