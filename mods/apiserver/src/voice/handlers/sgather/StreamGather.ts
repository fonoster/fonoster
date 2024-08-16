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
import { VoiceClient } from "../../types";
import { withErrorHandling } from "../utils/withErrorHandling";

const isDtmf = (digit: string) => /^[0-9*#]+$/.test(digit);

const gatherRequestSchema = z.object({
  source: z.optional(z.nativeEnum(StreamGatherSource))
});

function streamGatherHandler(voiceClient: VoiceClient) {
  return withErrorHandling(async (request: StartStreamGatherRequest) => {
    const { sessionRef, source } = request;

    // Error handled by withErrorHandling
    gatherRequestSchema.parse(request);

    const effectiveSource = source || StreamGatherSource.SPEECH_AND_DTMF;

    console.log(
      `Starting gather for session ${sessionRef}, effectiveSource: ${effectiveSource}`
    );

    const possibleText = [
      "Please say or enter your account number followed by the pound key.",
      "Ohh wao, you are still here. Please say or enter your account number followed by the pound key.",
      "1",
      "2",
      "3",
      "Sorry, I didn't get that. Please say or enter your account number followed by the pound key.",
      "4",
      "Hello, are you still there? Please say or enter your account number followed by the pound key."
    ];

    setInterval(() => {
      const result =
        possibleText[Math.floor(Math.random() * possibleText.length)];

      console.log(`Sending gather result: ${result}`);

      voiceClient.sendResponse({
        streamGatherPayload: {
          sessionRef,
          speech: isDtmf(result) ? null : result,
          digit: isDtmf(result) ? result : null
        }
      });
    }, 5000);
  });
}

export { streamGatherHandler };
