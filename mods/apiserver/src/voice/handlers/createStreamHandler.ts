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
import {
  StartStreamRequest,
  StreamAudioFormat,
  StreamDirection,
  StreamMessageType
} from "@fonoster/common";
import { z } from "zod";
import { VoiceClient } from "../types";
import { withErrorHandling } from "./utils/withErrorHandling";

const streamRequestSchema = z.object({
  direction: z
    .nativeEnum(StreamDirection, { message: "Invalid stream direction" })
    .optional(),
  format: z
    .nativeEnum(StreamAudioFormat, { message: "Invalid stream audio format" })
    .optional()
});

function createStreamHandler(voiceClient: VoiceClient) {
  return withErrorHandling(async (request: StartStreamRequest) => {
    const { mediaSessionRef, direction, format } = request;

    streamRequestSchema.parse(request);

    const effectiveDirection = direction || StreamDirection.BOTH;
    const effectiveFormat = format || StreamAudioFormat.WAV;

    // FIXME: Implement stream IN and correct streamRef
    if (
      effectiveDirection.includes(StreamDirection.OUT) ||
      effectiveDirection === StreamDirection.BOTH
    ) {
      voiceClient.getTranscriptionsStream().on("data", (data) => {
        voiceClient.sendResponse({
          streamPayload: {
            mediaSessionRef,
            type: StreamMessageType.AUDIO_OUT,
            data,
            streamRef: "fixme",
            format: effectiveFormat
          }
        });
      });
    }

    voiceClient.sendResponse({
      startStreamResponse: {
        mediaSessionRef,
        streamRef: "fixme"
      }
    });
  });
}

export { createStreamHandler };
