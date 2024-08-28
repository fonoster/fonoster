/* eslint-disable no-loops/no-loops */
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
import { makeVad } from "./makeVad";
import { Vad } from "./types";

class SileroVad implements Vad {
  private vad: (data: Uint8Array, callback: (event: string) => void) => void;

  async init() {
    this.vad = await makeVad();
  }

  processChunk(
    data: Uint8Array,
    callback: (event: "SPEECH_START" | "SPEECH_END") => void
  ) {
    this.vad(data, callback);
  }
}

export { SileroVad };
