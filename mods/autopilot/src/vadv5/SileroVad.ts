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
import { getLogger } from "@fonoster/logger";
import { createVad } from "./createVad";
import { Vad } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

class SileroVad implements Vad {
  private vad: (data: Uint8Array, callback: (event: string) => void) => void;
  private readonly params: {
    pathToModel: string;
    activationThreshold: number;
    deactivationThreshold: number;
    debounceFrames: number;
  };

  constructor(params: {
    pathToModel: string;
    activationThreshold: number;
    deactivationThreshold: number;
    debounceFrames: number;
  }) {
    logger.verbose("starting instance of silero vad v5", { ...params });
    this.params = params;
  }

  pathToModel: string;
  activationThreshold: number;
  deactivationThreshold: number;
  debounceFrames: number;

  async init() {
    this.vad = await createVad(this.params);
  }

  processChunk(
    data: Uint8Array,
    callback: (event: "SPEECH_START" | "SPEECH_END") => void
  ) {
    if (!this.vad) {
      throw new Error("VAD not initialized");
    }
    this.vad(data, callback);
  }
}

export { SileroVad };
