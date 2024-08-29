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
import { getLogger } from "@fonoster/logger";
import { Actor, createActor } from "xstate";
import { machine } from "./machine/machine";
import { AutopilotParams } from "./types";
import { Vad } from "./vad";

const logger = getLogger({ service: "autopilot", filePath: __filename });

class Autopilot {
  private actor: Actor<typeof machine>;

  constructor(private params: AutopilotParams) {
    const { voice, languageModel, assistantConfig } = this.params;
    this.subscribeToActorState();
    this.setupVoiceStream();
    this.setupSpeechGathering();
    this.actor = createActor(machine, {
      input: {
        ...assistantConfig,
        languageModel: languageModel,
        voice
      }
    });
  }

  start() {
    this.actor.start();
  }

  private subscribeToActorState() {
    this.actor.subscribe((state) => {
      logger.verbose("actor's new state is", { state: state.value });
    });
  }

  private async setupVoiceStream() {
    const { voice, vad } = this.params;
    const stream = await voice.stream();

    stream.onData(this.handleVoicePayload(vad));
  }

  private handleVoicePayload(vad: Vad) {
    return (chunk: Uint8Array) => {
      try {
        vad.processChunk(chunk, (event) => {
          if (["SPEECH_START", "SPEECH_END"].includes(event)) {
            logger.verbose("received speech event", { event });

            this.actor.send({ type: event });
          }
        });
      } catch (err) {
        logger.error("an error occurred while processing vad", err);
      }
    };
  }

  private async setupSpeechGathering() {
    const { voice } = this.params;
    const stream = await voice.sgather();

    stream.onData((speech: string) => {
      logger.verbose("received speech result", { speech });

      if (speech) {
        this.actor.send({ type: "SPEECH_RESULT", speech });
      }
    });
  }
}

export { Autopilot };
