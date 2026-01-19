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
  GatherRequest,
  GatherSource,
  MUST_BE_A_SINGLE_CHARACTER,
  POSITIVE_INTEGER_MESSAGE
} from "@fonoster/common";
import { z } from "zod";
import { VoiceClient } from "../../types";
import { isDtmf } from "../utils";
import { withErrorHandling } from "../utils/withErrorHandling";
import { getTimeoutPromise } from "./getTimeoutPromise";

const gatherRequestSchema = z.object({
  source: z
    .optional(z.nativeEnum(GatherSource, { message: "Invalid gather source" }))
    .optional(),
  maxDigits: z
    .number()
    .int({
      message: POSITIVE_INTEGER_MESSAGE
    })
    .positive({
      message: POSITIVE_INTEGER_MESSAGE
    })
    .optional(),
  finishOnKey: z
    .string()
    .regex(/^[0-9*#]$/)
    .max(1, { message: MUST_BE_A_SINGLE_CHARACTER })
    .optional()
});

function createGatherHandler(voiceClient: VoiceClient) {
  return withErrorHandling(async (request: GatherRequest) => {
    const { mediaSessionRef, source, timeout, finishOnKey, maxDigits } =
      request;

    gatherRequestSchema.parse(request);

    const { timeoutPromise, effectiveTimeout } = getTimeoutPromise(timeout);

    const effectiveSource = source || GatherSource.SPEECH_AND_DTMF;

    const promises = [timeoutPromise];

    if (effectiveSource.includes(GatherSource.SPEECH)) {
      promises.push(voiceClient.transcribe().then((result) => result));
    }

    if (effectiveSource.includes(GatherSource.DTMF)) {
      promises.push(
        voiceClient
          .waitForDtmf({
            mediaSessionRef,
            finishOnKey,
            maxDigits,
            timeout: effectiveTimeout,
            onDigitReceived: timeoutPromise.cancelGlobalTimer
          })
          .then((result) => result)
      );
    }

    const result = (await Promise.race(promises)) as {
      responseTime: number;
      speech?: string;
      digits?: string;
    };

    voiceClient.sendResponse({
      gatherResponse: {
        mediaSessionRef,
        responseTime: result.responseTime,
        speech: isDtmf(result.digits) ? undefined : result.speech,
        digits: isDtmf(result.digits) ? result.digits : undefined
      }
    });
  });
}

export { createGatherHandler };
