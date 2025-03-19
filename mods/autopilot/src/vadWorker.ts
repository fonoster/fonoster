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
import { join } from "path";
import { parentPort, workerData } from "worker_threads";
import { SileroVad } from "./vad/SileroVad";

const vad = new SileroVad({
  ...workerData,
  pathToModel: join(__dirname, "..", "silero_vad_v5.onnx")
});

vad.init().then(() => {
  // Send ready message to parent
  parentPort?.postMessage("VAD_READY");

  parentPort?.on("message", (chunk) => {
    vad.processChunk(chunk, (voiceActivity) => {
      parentPort?.postMessage(voiceActivity);
    });
  });
});
