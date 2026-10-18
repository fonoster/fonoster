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
import { CallType } from "@fonoster/types";
import { v5 as uuidv5 } from "uuid";
import { mapCallDirectionToEnum } from "./mapCallDirectionToEnum";

const ACCESS_KEY_ID_HEADER = "X-Access-Key-Id";
const CALL_REF_HEADER = "X-Call-Ref";
const CALL_DIRECTION_HEADER = "X-Call-Direction";
const DOD_NUMBER_HEADER = "X-Dod-Number";
const API_ORIGINATED_TYPE_HEADER = "X-Is-Api-Originated-Type";

// SIP-originated calls don't carry a ref header, so we derive one from Routr's call id. It must
// be the same for every event of the call on every replica and after a restart (each replica
// minting its own split one call into several CDR series), so it is a name-based UUID (v5)
// rather than a remembered random one.
const SIP_CALL_REF_NAMESPACE = "6f1d2c3e-8a4b-5c6d-9e0f-1a2b3c4d5e6f";

/** The ref of a SIP-originated call: the same for a callId everywhere. */
function syntheticRef(callId: string): string {
  return uuidv5(String(callId), SIP_CALL_REF_NAMESPACE);
}

function transformEvent(
  event: Record<string, unknown>
): Record<string, unknown> {
  const transformedEvent: Record<string, unknown> = { ...event };

  if (event.startTime) {
    const time = new Date(event.startTime as string).getTime() / 1000;
    transformedEvent.startedAt = time;
    transformedEvent.endedAt = time;
    delete transformedEvent.startTime;
  }

  if (event.endTime) {
    transformedEvent.endedAt =
      new Date(event.endTime as string).getTime() / 1000;
    delete transformedEvent.endTime;
  }

  if (event.hangupCause) {
    transformedEvent.status = event.hangupCause;
    delete transformedEvent.hangupCause;
  }

  if (event.to) {
    const to = event.to as string;
    transformedEvent.to = to.split("@")[0].replace("sip:", "");
  }

  const extraHeaders = event.extraHeaders as Record<string, string>;

  if (extraHeaders && Object.keys(extraHeaders).length > 0) {
    if (extraHeaders[ACCESS_KEY_ID_HEADER]) {
      transformedEvent.accessKeyId = extraHeaders[ACCESS_KEY_ID_HEADER];
    }

    if (extraHeaders[CALL_REF_HEADER]) {
      transformedEvent.ref = extraHeaders[CALL_REF_HEADER];
    } else {
      // SIP originated calls don't have a ref: derive it from the call id.
      transformedEvent.ref = syntheticRef(event.callId as string);
    }

    if (extraHeaders[DOD_NUMBER_HEADER]) {
      transformedEvent.from = extraHeaders[DOD_NUMBER_HEADER];
    }

    if (extraHeaders[API_ORIGINATED_TYPE_HEADER]) {
      transformedEvent.type = CallType.API_ORIGINATED;
    }

    if (extraHeaders[CALL_DIRECTION_HEADER]) {
      transformedEvent.direction = mapCallDirectionToEnum(
        extraHeaders[CALL_DIRECTION_HEADER]
      );
    }
  }

  // Delete the extra headers as they may contain sensitive information
  delete transformedEvent.extraHeaders;
  delete transformedEvent.callId;

  return transformedEvent;
}

export { syntheticRef, transformEvent };
