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
import { StartStreamGatherRequest, StreamGatherSource } from "@fonoster/common";
import { z } from "zod";
import { VoiceClient } from "../types";
import { withErrorHandling } from "./utils/withErrorHandling";

const gatherRequestSchema = z.object({
  source: z.optional(
    z.nativeEnum(StreamGatherSource, {
      message: "Invalid stream gather source."
    })
  )
});

function createStreamGatherHandler(voiceClient: VoiceClient) {
  return withErrorHandling(async (request: StartStreamGatherRequest) => {
    const { mediaSessionRef, source } = request;

    gatherRequestSchema.parse(request);

    const effectiveSource = source || StreamGatherSource.SPEECH_AND_DTMF;

    if (effectiveSource.includes(StreamGatherSource.DTMF)) {
      voiceClient.startDtmfGather(mediaSessionRef, (event) => {
        const { digit } = event;
        voiceClient.sendResponse({
          streamGatherPayload: {
            mediaSessionRef,
            digit,
            responseTime: 0
          }
        });
      });
    }

    if (effectiveSource.includes(StreamGatherSource.SPEECH)) {
      voiceClient.startSpeechGather((event) => {
        const { speech, responseTime } = event;
        voiceClient.sendResponse({
          streamGatherPayload: {
            mediaSessionRef,
            speech,
            responseTime
          }
        });
      });
    }

    voiceClient.sendResponse({
      startStreamGatherResponse: {
        mediaSessionRef
      }
    });
  });
}

export { createStreamGatherHandler };
