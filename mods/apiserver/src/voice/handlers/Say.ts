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
import { struct } from "pb-util";
import { z } from "zod";
import { awaitForPlaybackFinished } from "./awaitForPlaybackFinished";
import { withErrorHandling } from "./withErrorHandling";
import { APISERVER_HOST, FILES_SERVER_PORT } from "../../envs";
import { VoiceClient } from "../types";

const sayRequestSchema = z.object({
  text: z.string(),
  sessionRef: z.string(),
  playbackRef: z.string().optional().nullable(),
  options: z.record(z.unknown()).optional().nullable()
});

const getMediaUrl = (filename: string) =>
  `sound:http://${APISERVER_HOST}:${FILES_SERVER_PORT}/sounds/${filename}.sln16`;

function sayHandler(ari: Client, voiceClient: VoiceClient) {
  return withErrorHandling(async (request: SayRequest) => {
    const { sessionRef } = request;

    // Error handled by withErrorHandling
    sayRequestSchema.parse(request);

    const playbackRef = request.playbackRef || nanoid(10);

    const filename = await voiceClient.synthesize(
      request.text,
      request.options ? struct.decode(request.options) : {}
    );

    await ari.channels.play({
      channelId: sessionRef,
      media: getMediaUrl(filename),
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

export { sayHandler };
