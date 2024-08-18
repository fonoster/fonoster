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
import { StreamGatherSource } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import VoiceServer, { VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { createActor } from "xstate";
import { machine } from "./machine/machine";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const config = {
  // Only do this for testing
  skipIdentity: true
};

new VoiceServer(config).listen(
  async (req: VoiceRequest, voice: VoiceResponse) => {
    logger.verbose("voice request", JSON.stringify(req, null, 2));

    const autopilot = createActor(machine, {
      input: {
        idleTimeoutCount: 0,
        idleTimeoutLimit: 3,
        voice
      }
    });

    autopilot.subscribe(async (snapshot) => {
      logger.verbose("status snapshot", {
        status: snapshot.value,
        idleTimeoutCount: snapshot.context.idleTimeoutCount
      });
    });

    autopilot.start();

    const stream = await voice.sgather({
      source: StreamGatherSource.SPEECH
    });

    stream.onPayload((payload) => {
      logger.verbose("payload", payload);
      autopilot.send({ type: "HUMAN_PROMPT", speech: payload.speech! });
    });
  }
);
