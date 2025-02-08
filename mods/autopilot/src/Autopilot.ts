/*
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
import path from "path";
import { Worker } from "worker_threads";
import { getLogger } from "@fonoster/logger";
import { Actor, createActor } from "xstate";
import { machine } from "./machine/machine";
import { AutopilotParams } from "./types";
import { VadEvent } from "./vad";

const logger = getLogger({ service: "autopilot", filePath: __filename });

class Autopilot {
  private readonly actor: Actor<typeof machine>;
  private readonly vadWorker: Worker;

  constructor(private readonly params: AutopilotParams) {
    const { voice, languageModel, conversationSettings } = this.params;
    const vadWorkerPath = path.resolve(__dirname, "../dist", "./vadWorker");
    this.vadWorker = new Worker(vadWorkerPath, {
      workerData: conversationSettings.vad
    });
    this.actor = createActor(machine, {
      input: {
        conversationSettings,
        languageModel,
        voice
      }
    });
  }

  start() {
    this.actor.start();
    this.actor.subscribe((state) => {
      logger.verbose("actor's new state is", { state: state.value });
    });
    this.setupVoiceStream();
    this.setupSpeechGathering();

    this.vadWorker.on("error", (err) => {
      logger.error("vad worker error", err);
    });

    this.vadWorker.on("exit", (code) => {
      if (code !== 0) {
        logger.error("vad worker stopped with exit code", { code });
      }
    });
  }

  stop() {
    logger.verbose("stopping autopilot");
    this.actor.stop();
  }

  private async setupVoiceStream() {
    const { voice } = this.params;
    const stream = await voice.stream();

    stream.onData(this.handleVoicePayload.bind(this));

    this.vadWorker.on("message", (event: VadEvent) => {
      logger.verbose("received speech event from vad", { event });

      if (event === "SPEECH_START") {
        this.actor.send({ type: "SPEECH_START" });
      } else if (event === "SPEECH_END") {
        this.actor.send({ type: "SPEECH_END" });
      }
    });
  }

  private handleVoicePayload(chunk: Uint8Array) {
    try {
      this.vadWorker.postMessage(chunk);
    } catch (err) {
      logger.error("an error occurred while processing vad", err);
    }
  }

  private async setupSpeechGathering() {
    const { voice } = this.params;
    const stream = await voice.sgather();

    stream.onData((payload: { speech: string; responseTime: number }) => {
      const { speech, responseTime } = payload;

      logger.verbose("received speech result", { speech, responseTime });

      if (payload.speech) {
        this.actor.send({ type: "SPEECH_RESULT", speech, responseTime });
      }
    });
  }
}

export { Autopilot };
