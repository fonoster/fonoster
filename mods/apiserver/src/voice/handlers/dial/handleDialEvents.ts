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

function handleDialEvents(voiceClient: VoiceClient) {
  return async (event: { dialstatus: string }) => {
    let status = event.dialstatus.toLowerCase();

    if (
      !["cancel", "answer", "busy", "progress", "noanswer"].includes(status)
    ) {
      return;
    } else if (status === "chanunavail" || status === "congestion") {
      status = "failed";
    }

    voiceClient.sendResponse({
      dialResponse: {
        // Fixme: Map to DialStatus
        status: DialStatus.ANSWER
      }
    });
  };
}

export { handleDialEvents };
