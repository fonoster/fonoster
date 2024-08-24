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
  StreamDirection,
  StreamGatherSource,
  StreamPayload
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceResponse } from "@fonoster/voice";
import { Actor, createActor } from "xstate";
import { makeAssistant } from "./assistants";
import { Assistant } from "./assistants/assistants";
import { machine } from "./machine/machine";
import { AutopilotConfig } from "./types";
import { Vad, makeVad } from "./vad";

const logger = getLogger({ service: "autopilot", filePath: __filename });

class Autopilot {
  private assistant: Assistant;
  private actor: Actor<typeof machine>;
  private voice: VoiceResponse;

  constructor(private config: AutopilotConfig) {
    this.assistant = makeAssistant(config.assistantConfig);
    this.actor = this.createActor();
    this.voice = config.voice;
  }

  start() {
    this.actor.start();
    this.setupSpeechGathering();
    this.setupVoiceStream();
    this.subscribeToActorState();
  }

  private createActor() {
    const { firstMessage, voice } = this.config;
    return createActor(machine, {
      input: { firstMessage, voice, assistant: this.assistant }
    });
  }

  private subscribeToActorState() {
    this.actor.subscribe((state) => {
      logger.verbose("actor's new state is", { state: state.value });
    });
  }

  private async setupVoiceStream() {
    const stream = await this.config.voice.stream({
      direction: StreamDirection.OUT
    });

    const vad = await makeVad();
    stream.onPayload(this.handleVoicePayload(vad));
  }

  private handleVoicePayload(vad: Vad) {
    return async (payload: StreamPayload) => {
      try {
        // TODO: Investigate why we need to cast this to Float32Array
        const data = payload.data as unknown as Float32Array;
        await vad(data, (event) => {
          if (event === "SPEECH_START" || event === "SPEECH_END") {
            this.actor.send({ type: event });
          }
        });
      } catch (err) {
        logger.error("an error occurred while processing vad", err);
      }
    };
  }

  private async setupSpeechGathering() {
    const stream = await this.voice.sgather({
      source: StreamGatherSource.SPEECH
    });

    stream.onPayload((payload) => {
      this.actor.send({ type: "HUMAN_PROMPT", speech: payload.speech! });
    });
  }
}

export { Autopilot };
