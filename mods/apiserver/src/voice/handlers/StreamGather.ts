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
import { StartStreamGatherRequest, StreamGatherSource } from "@fonoster/common";
import { z } from "zod";
import { withErrorHandling } from "./utils/withErrorHandling";
import { VoiceClient } from "../types";

const gatherRequestSchema = z.object({
  source: z.optional(z.nativeEnum(StreamGatherSource))
});

function streamGatherHandler(voiceClient: VoiceClient) {
  return withErrorHandling(async (request: StartStreamGatherRequest) => {
    const { sessionRef, source } = request;

    // Error handled by withErrorHandling
    gatherRequestSchema.parse(request);

    const effectiveSource = source || StreamGatherSource.SPEECH_AND_DTMF;

    if (effectiveSource.includes(StreamGatherSource.DTMF)) {
      voiceClient.startDtmfGather(sessionRef, (event) => {
        const { digit } = event;
        voiceClient.sendResponse({
          streamGatherPayload: {
            sessionRef,
            digit
          }
        });
      });
    }

    if (effectiveSource.includes(StreamGatherSource.SPEECH)) {
      voiceClient.startSpeechGather((event) => {
        const { speech } = event;
        voiceClient.sendResponse({
          streamGatherPayload: {
            sessionRef,
            speech
          }
        });
      });
    }

    voiceClient.sendResponse({
      startStreamGatherResponse: {
        sessionRef
      }
    });
  });
}

export { streamGatherHandler };
