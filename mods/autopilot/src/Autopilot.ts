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
import {
  StreamAudioFormat,
  StreamDirection,
  StreamGatherSource
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { createActor } from "xstate";
import { makeAssistant } from "./assistants";
import { machine } from "./machine/machine";
import { AutopilotConfig } from "./types";
import { makeVad } from "./vad";

const logger = getLogger({ service: "autopilot", filePath: __filename });

class Autopilot {
  constructor(private config: AutopilotConfig) {
    this.config = config;
  }

  start() {
    const { voice, assistantConfig, firstMessage } = this.config;

    const assistant = makeAssistant(assistantConfig);

    const actor = createActor(machine, {
      input: { firstMessage, voice, assistant }
    });

    actor.start();

    actor.subscribe((state) => {
      logger.verbose("actor's new state is", { state: state.value });
    });

    voice
      .stream({
        // TODO: Change to OUT and test
        // TODO: Remove format as required
        direction: StreamDirection.BOTH,
        format: StreamAudioFormat.WAV
      })
      .then(async (stream) => {
        const vad = await makeVad();

        stream.onPayload(async (payload) => {
          vad(payload.data as any, (event) => {
            if (event === "SPEECH_START") {
              actor.send({ type: "VOICE_DETECTED" });
            }
          });
        });
      });

    voice
      .sgather({
        source: StreamGatherSource.SPEECH
      })
      .then((stream) => {
        stream.onPayload((payload) => {
          actor.send({ type: "HUMAN_PROMPT", speech: payload.speech! });
        });
      });
  }
}

export { Autopilot };
