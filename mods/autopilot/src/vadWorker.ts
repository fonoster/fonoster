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
import { join } from "path";
import { parentPort, workerData } from "worker_threads";
import { SILERO_VAD_VERSION } from "./envs";
import { SileroVad } from "./vad/SileroVad";
import { SileroVad as SileroVadV5 } from "./vadv5/SileroVad";

const vad =
  SILERO_VAD_VERSION === "v4"
    ? new SileroVad({
        ...workerData,
        pathToModel: join(__dirname, "..", "silero_vad.onnx")
      })
    : new SileroVadV5({
        ...workerData,
        pathToModel: join(__dirname, "..", "silero_vad_v5.onnx")
      });

vad.init().then(() => {
  parentPort?.on("message", (chunk) => {
    vad.processChunk(chunk, (voiceActivity) => {
      parentPort?.postMessage(voiceActivity);
    });
  });
});
