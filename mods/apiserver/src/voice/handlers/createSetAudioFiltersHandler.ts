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
import { SetAudioFiltersRequest } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { struct } from "pb-util";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { AudioFilterConfig } from "../filters";
import { VoiceClient } from "../types";
import { withErrorHandling } from "./utils/withErrorHandling";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const requestSchema = z.object({
  mediaSessionRef: z.string(),
  filters: z
    .array(
      z.object({
        name: z.string().min(1),
        options: z.unknown().optional()
      })
    )
    .optional()
});

/**
 * Sets the audio filters for the session. The filters run on the caller's
 * audio before it reaches speech recognition and the application's media
 * stream.
 *
 * Failure here never fails the call: the application is told what went wrong
 * and the call continues with whatever filtering was already in place, or none.
 */
function createSetAudioFiltersHandler(voiceClient: VoiceClient) {
  return withErrorHandling(async (request: SetAudioFiltersRequest) => {
    const { mediaSessionRef } = request;

    // Never rethrow, and always answer: a rejected handler escapes as an
    // unhandled rejection and takes the process down with every call on it,
    // and a verb left unanswered strands the application's await for the rest
    // of the call. The application is told instead, and the call keeps going
    // with whatever filtering it had.
    try {
      requestSchema.parse(request);

      const config = (request.filters ?? []).map((filter) => ({
        name: filter.name,
        options: filter.options
          ? (struct.decode(
              filter.options as Parameters<typeof struct.decode>[0]
            ) as Record<string, unknown>)
          : {}
      })) as AudioFilterConfig[];

      await voiceClient.setAudioFilters(config);
    } catch (err) {
      const message =
        err instanceof z.ZodError
          ? fromError(err, { prefix: null }).toString()
          : ((err as Error)?.message ?? String(err));

      logger.warn("could not set audio filters; call continues unfiltered", {
        mediaSessionRef,
        error: message
      });

      voiceClient.sendResponse({
        setAudioFiltersResponse: { mediaSessionRef, error: message }
      });

      return;
    }

    voiceClient.sendResponse({
      setAudioFiltersResponse: {
        mediaSessionRef
      }
    });
  });
}

export { createSetAudioFiltersHandler };
