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
import { RecordFormat, RecordRequest } from "@fonoster/common";
import { Client } from "ari-client";
import { nanoid } from "nanoid";
import { VoiceClient } from "../types";
import { awaitForRecordingFinished } from "./utils/awaitForRecordingFinished";
import { withErrorHandling } from "./utils/withErrorHandling";

function createRecordHandler(ari: Client, voiceClient: VoiceClient) {
  return withErrorHandling(async (request: RecordRequest) => {
    const { mediaSessionRef, maxDuration, maxSilence, beep, finishOnKey } =
      request;
    const name = nanoid(10);

    await ari.channels.record({
      channelId: mediaSessionRef,
      format: RecordFormat.WAV,
      name,
      beep,
      maxDurationSeconds: maxDuration,
      maxSilenceSeconds: maxSilence,
      terminateOn: finishOnKey
    });

    const { duration } = await awaitForRecordingFinished(ari, name);

    voiceClient.sendResponse({
      recordResponse: {
        mediaSessionRef,
        name,
        format: RecordFormat.WAV,
        duration
      }
    });
  });
}

export { createRecordHandler };
