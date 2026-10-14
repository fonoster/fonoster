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
import type { CallDetailRecord } from "@fonoster/types";

const at = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000);

function call(
  ref: string,
  minutesAgo: number,
  fields: Partial<Record<keyof CallDetailRecord, unknown>>
): CallDetailRecord {
  const startedAt = at(minutesAgo);
  const duration = (fields.duration as number) ?? 0;
  return {
    ref,
    accessKeyId: "WO00000000000000000000000000000001",
    type: "API_ORIGINATED",
    status: "NORMAL_CLEARING",
    direction: "TO_PSTN",
    from: "+18295550199",
    to: "+18295550110",
    duration,
    startedAt,
    endedAt: new Date(startedAt.getTime() + duration * 1000),
    amdStatus: "AMD_STATUS_UNSPECIFIED",
    ...fields
  } as CallDetailRecord;
}

/** A morning of calls in the shapes the API returns them. */
export const sampleCalls: CallDetailRecord[] = [
  call("9b21e7c4-0d1f-4a51-9e0a-7d8a1c2b3e4f", 12, {
    duration: 24,
    amdStatus: "HUMAN",
    amdConfidence: 0.94,
    amdLatencyMs: 820,
    amdDetector: "sidecar"
  }),
  call("4c8e2a10-5b7d-4f3e-8a21-0c9d6e5f4a3b", 15, {
    to: "+18295550131",
    duration: 31,
    amdStatus: "VOICEMAIL"
  }),
  call("e7f1c2d3-9a8b-4c6d-b5e4-3f2a1b0c9d8e", 23, {
    type: "SIP_ORIGINATED",
    direction: "FROM_PSTN",
    from: "+18095550142",
    to: "+34910555211",
    status: "NO_ANSWER"
  }),
  call("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d", 45, {
    to: "+18295550189",
    status: "USER_BUSY"
  }),
  call("5d6e7f8a-9b0c-4d1e-a2f3-4a5b6c7d8e9f", 74, {
    type: "SIP_ORIGINATED",
    direction: "FROM_PSTN",
    from: "+18095550155",
    to: "+34910555211",
    duration: 291
  }),
  call("8f9e0d1c-2b3a-4c5d-9e6f-7a8b9c0d1e2f", 121, {
    to: "+18295550177",
    status: "CALL_REJECTED"
  })
];
