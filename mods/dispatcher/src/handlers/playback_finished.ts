/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import WebSocket from "ws";
import logger from "@fonoster/logger";

export const playbackFinishedHandler = (ws: WebSocket, playback: any) => {
  logger.silly("sending playback finished event", { playbackId: playback.id });

  if (ws.readyState !== WebSocket.OPEN) {
    logger.warn("ignoring socket request on lost connection");
    return;
  }

  ws.send(
    JSON.stringify({
      type: "PlaybackFinished",
      data: {
        playbackId: playback.id
      }
    })
  );
};
