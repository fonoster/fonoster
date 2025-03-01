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
import { SayRequest } from "@fonoster/common";
import { Client } from "ari-client";
import { nanoid } from "nanoid";
import { struct } from "pb-util";
import { z } from "zod";
import { APISERVER_HOST, HTTP_BRIDGE_PORT } from "../../envs";
import { VoiceClient } from "../types";
import { awaitForPlaybackFinished } from "./utils/awaitForPlaybackFinished";
import { withErrorHandling } from "./utils/withErrorHandling";

const sayRequestSchema = z.object({
  text: z.string(),
  sessionRef: z.string(),
  playbackRef: z.string().optional(),
  options: z.record(z.unknown()).optional()
});

const getMediaUrl = (filename: string) =>
  `sound:http://${APISERVER_HOST}:${HTTP_BRIDGE_PORT}/api/sounds/${filename}.sln16`;

function createSayHandler(ari: Client, voiceClient: VoiceClient) {
  return withErrorHandling(async (request: SayRequest) => {
    const { sessionRef: channelId } = request;

    sayRequestSchema.parse(request);

    const playbackRef = request.playbackRef || nanoid(10);

    const mediaId = await voiceClient.synthesize(
      request.text,
      request.options ? struct.decode(request.options) : {}
    );

    await ari.channels.play({
      channelId,
      media: getMediaUrl(mediaId),
      playbackId: playbackRef
    });

    await awaitForPlaybackFinished(ari, playbackRef);

    voiceClient.sendResponse({
      sayResponse: {
        playbackRef
      }
    });
  });
}

export { createSayHandler };
