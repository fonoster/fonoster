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
import { getLogger } from "@fonoster/logger";
import * as ort from "onnxruntime-node";
import { chunkToFloat32Array } from "./chunkToFloat32Array";
import { SileroVadModel } from "./SileroVadModel";
import { VadParams } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const FULL_FRAME_SIZE = 1600; // Equivalent to 100ms @ 16kHz
const FRAME_SIZE = 480; // Use last 30ms from the full frame for VAD processing

async function createVad(params: VadParams) {
  const {
    pathToModel,
    activationThreshold,
    deactivationThreshold,
    debounceFrames
  } = params;

  const effectivePath =
    pathToModel || join(__dirname, "..", "..", "silero_vad.onnx");
  const silero = await SileroVadModel.new(ort, effectivePath);

  let audioBuffer: number[] = [];
  let isSpeechActive = false;
  let framesSinceStateChange = 0;

  return async function process(
    chunk: Uint8Array,
    callback: (event: "SPEECH_START" | "SPEECH_END") => void
  ) {
    const float32Array = chunkToFloat32Array(chunk);
    audioBuffer.push(...float32Array);

    // Process full frames from the buffer
    while (audioBuffer.length >= FULL_FRAME_SIZE) {
      // Extract one full frame worth of samples
      const fullFrame = audioBuffer.slice(0, FULL_FRAME_SIZE);
      audioBuffer = audioBuffer.slice(FULL_FRAME_SIZE);

      // Use the last FRAME_SIZE samples from the full frame for VAD processing
      const frame = fullFrame.slice(fullFrame.length - FRAME_SIZE);
      const result = await silero.process(new Float32Array(frame));
      const rawScore = result.isSpeech;

      logger.silly("Frame processing", {
        rawScore,
        isSpeechActive,
        framesSinceStateChange,
        pendingSamples: audioBuffer.length
      });

      framesSinceStateChange++;

      if (isSpeechActive) {
        // If currently in speech, check if the score has dropped below the deactivation threshold
        if (
          rawScore < deactivationThreshold &&
          framesSinceStateChange >= debounceFrames
        ) {
          isSpeechActive = false;
          callback("SPEECH_END");
          silero.resetState(); // Reset VAD state after speech ends
          framesSinceStateChange = 0;
          logger.silly("Speech end detected", { rawScore });
        }
      } else {
        // If not currently in speech, check if the score exceeds the activation threshold
        if (
          rawScore > activationThreshold &&
          framesSinceStateChange >= debounceFrames
        ) {
          isSpeechActive = true;
          framesSinceStateChange = 0;
          callback("SPEECH_START");
          logger.silly("Speech start detected", { rawScore });
        }
      }
    }
  };
}

export { createVad };
