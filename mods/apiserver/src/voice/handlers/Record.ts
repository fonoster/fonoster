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
import { RecordFormat, RecordRequest } from "@fonoster/common";
import { status } from "@grpc/grpc-js";
import { nanoid } from "nanoid";
import { GRPCError } from "../GRPCError";
import {
  AriClient,
  AriEvent,
  RecordingFinishedEvent,
  VoiceClient
} from "../types";

const awaitForRecordingFinished = async (
  ari: AriClient,
  name: string
): Promise<{ duration: number }> => {
  return new Promise((resolve, reject) => {
    const listener = (event: RecordingFinishedEvent) => {
      if ("cause" in event.recording) {
        ari.removeListener(AriEvent.RECORDING_FINISHED, listener);
        ari.removeListener(AriEvent.RECORDING_FAILED, listener);
        reject(new GRPCError(status.INTERNAL, "Recording failed"));
      } else if (name === event.recording.name) {
        ari.removeListener(AriEvent.RECORDING_FINISHED, listener);
        ari.removeListener(AriEvent.RECORDING_FAILED, listener);
        resolve({ duration: event.recording.duration });
      }
    };

    ari.on(AriEvent.RECORDING_FINISHED, listener);
    ari.on(AriEvent.RECORDING_FAILED, listener);
  });
};

function recordHandler(ari: AriClient, voiceClient: VoiceClient) {
  return async (request: RecordRequest) => {
    const { sessionRef, maxDuration, maxSilence, beep, finishOnKey } = request;
    const name = nanoid(10);

    if (voiceClient) {
      await ari.channels.record({
        channelId: sessionRef,
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
          sessionRef,
          name,
          format: RecordFormat.WAV,
          duration
        }
      });
    }
  };
}

export { recordHandler };
