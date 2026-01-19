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
  PlaybackControlAction,
  PlaybackControlRequest
} from "@fonoster/common";
import { Client } from "ari-client";
import { z } from "zod";
import { VoiceClient } from "../types";
import { withErrorHandling } from "./utils/withErrorHandling";

const requestSchema = z.object({
  mediaSessionRef: z.string(),
  playbackRef: z.string().optional(),
  action: z.nativeEnum(PlaybackControlAction, {
    message: "Invalid playback control action."
  })
});

function createPlaybackControlHandler(ari: Client, voiceClient: VoiceClient) {
  return withErrorHandling(
    async (playbackControlReq: PlaybackControlRequest) => {
      requestSchema.parse(playbackControlReq);

      const {
        mediaSessionRef,
        playbackRef: playbackId,
        action
      } = playbackControlReq;

      try {
        if (action === PlaybackControlAction.STOP) {
          await ari.playbacks.stop({ playbackId });
        } else {
          await ari.playbacks.control({ playbackId, operation: action });
        }
      } catch (err) {
        // Ignore error
      }

      voiceClient.sendResponse({
        playbackControlResponse: {
          mediaSessionRef
        }
      });
    }
  );
}

export { createPlaybackControlHandler };
