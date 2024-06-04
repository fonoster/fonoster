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
import { DialStatus } from "@fonoster/common";
import { VoiceClient } from "../../types";

const FailedStatus = ["CHANUNAVAIL", "CONGESTION"];

function handleDialEvents(voiceClient: VoiceClient) {
  return async (event: { dialstatus: string }) => {
    const status = event.dialstatus.toUpperCase();
    const dialStatusArray = Object.keys(DialStatus).map(
      (key) => DialStatus[key]
    );
    let mappedStatus: DialStatus;

    if (FailedStatus.includes(status)) {
      mappedStatus = DialStatus.FAILED;
    } else if (dialStatusArray.includes(status)) {
      mappedStatus = DialStatus[status];
    } else {
      // If the status is not in the DialStatus enum, we ignore the event
      return;
    }

    voiceClient.sendResponse({
      dialResponse: {
        status: mappedStatus
      }
    });
  };
}

export { handleDialEvents };
