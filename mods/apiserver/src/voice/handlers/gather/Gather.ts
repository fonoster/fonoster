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
import { GatherRequest, GatherSource } from "@fonoster/common";
import { z } from "zod";
import { getTimeoutPromise } from "./getTimeoutPromise";
import { VoiceClient } from "../../types";
import { isDtmf } from "../utils";
import { withErrorHandling } from "../utils/withErrorHandling";

const gatherRequestSchema = z.object({
  source: z.optional(z.nativeEnum(GatherSource)),
  maxDigits: z.number().optional().nullable(),
  // TODO: Ensure it is a dtmf character
  finishOnKey: z.string().max(1).optional().nullable()
});

function gatherHandler(voiceClient: VoiceClient) {
  return withErrorHandling(async (request: GatherRequest) => {
    const { sessionRef, source, timeout, finishOnKey, maxDigits } = request;

    // Error handled by withErrorHandling
    gatherRequestSchema.parse(request);

    const { timeoutPromise, effectiveTimeout } = getTimeoutPromise(timeout);

    const effectiveSource = source || GatherSource.SPEECH_AND_DTMF;

    const promises = [timeoutPromise];

    if (effectiveSource.includes(GatherSource.SPEECH)) {
      promises.push(voiceClient.transcribe().then((result) => result.speech));
    }

    if (effectiveSource.includes(GatherSource.DTMF)) {
      promises.push(
        voiceClient
          .waitForDtmf({
            sessionRef,
            finishOnKey,
            maxDigits,
            timeout: effectiveTimeout,
            onDigitReceived: timeoutPromise.cancelGlobalTimer
          })
          .then(({ digits }) => digits)
      );
    }

    const result = await Promise.race(promises);

    voiceClient.sendResponse({
      gatherResponse: {
        sessionRef,
        speech: isDtmf(result) ? null : result,
        digits: isDtmf(result) ? result : null
      }
    });
  });
}

export { gatherHandler };
