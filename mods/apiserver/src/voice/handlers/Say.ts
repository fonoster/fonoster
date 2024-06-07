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
import { SayRequest } from "@fonoster/common";
import { Client } from "ari-client";
import { nanoid } from "nanoid";
import { awaitForPlaybackFinished } from "./awaitForPlaybackFinished";
import { VoiceClient } from "../types";

function sayHandler(ari: Client, voiceClient: VoiceClient) {
  return async (request: SayRequest) => {
    const { sessionRef } = request;

    const playbackRef = request.playbackRef || nanoid(10);

    const filename = await voiceClient.synthesize(request.text);

    await ari.channels.play({
      channelId: sessionRef,
      media: `sound:${filename}`,
      playbackId: playbackRef
    });

    await awaitForPlaybackFinished(ari, playbackRef);

    voiceClient.sendResponse({
      sayResponse: {
        playbackRef
      }
    });
  };
}

export { sayHandler };
