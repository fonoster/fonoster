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
import { Client } from "ari-client";
import { AriEvent } from "../../types";

const awaitForPlaybackFinished = async (
  ari: Client,
  playbackRef: string
): Promise<void> => {
  return new Promise((resolve) => {
    const listener = (_: unknown, playback: { id: string }) => {
      if (playbackRef === playback.id) {
        ari.removeListener(AriEvent.PLAYBACK_FINISHED, listener);
        resolve();
      }
    };

    ari.on(AriEvent.PLAYBACK_FINISHED, listener);
  });
};

export { awaitForPlaybackFinished };
