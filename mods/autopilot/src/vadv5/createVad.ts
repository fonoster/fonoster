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
import { chunkToFloat32Array } from "../vad/chunkToFloat32Array";
import { VadParams } from "../vad/types";
import { SileroVadModel } from "./SileroVadModel";
import { ONNXRuntimeAPI } from "./types";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const FULL_FRAME_SIZE = 1024; // 64ms @ 16kHz
const BUFFER_SIZE = 512; // 32ms @ 16kHz

async function createVad(params: VadParams) {
  const {
    pathToModel,
    activationThreshold,
    deactivationThreshold,
    debounceFrames
  } = params;

  const effectivePath =
    pathToModel || join(__dirname, "..", "..", "silero_vad_v5.onnx");

  const ortAdapter: ONNXRuntimeAPI = {
    InferenceSession: {
      create: ort.InferenceSession.create.bind(ort.InferenceSession)
    },
    Tensor: ort.Tensor as unknown as ONNXRuntimeAPI["Tensor"]
  };

  const silero = await SileroVadModel.new(ortAdapter, effectivePath);

  let sampleBuffer: number[] = [];
  let isSpeechActive = false;
  let framesSinceStateChange = 0;

  // Reset internal state after a state change.
  const resetState = () => {
    isSpeechActive = false;
    framesSinceStateChange = 0;
    // Clear any pending audio samples to avoid using outdated values.
    sampleBuffer = [];
    silero.resetState();

    logger.silly("State reset -- sampleBuffer cleared");
  };

  return async function process(
    chunk: Uint8Array,
    callback: (event: "SPEECH_START" | "SPEECH_END") => void
  ) {
    // Convert the incoming chunk to normalized Float32 samples (using chunkToFloat32Array)
    const float32Array = chunkToFloat32Array(chunk);
    sampleBuffer.push(...float32Array);

    // Wait until we've collected a full frame worth of samples.
    while (sampleBuffer.length >= FULL_FRAME_SIZE) {
      const fullFrame = sampleBuffer.slice(0, FULL_FRAME_SIZE);
      sampleBuffer = sampleBuffer.slice(FULL_FRAME_SIZE);

      // Use the last BUFFER_SIZE samples from the full frame.
      const frame = fullFrame.slice(fullFrame.length - BUFFER_SIZE);
      const result = await silero.process(new Float32Array(frame));
      const rawScore = result.isSpeech;

      logger.silly("Frame processing", {
        rawScore,
        isSpeechActive,
        framesSinceStateChange,
        pendingSamples: sampleBuffer.length
      });

      framesSinceStateChange++;

      if (isSpeechActive) {
        // If already in speech, check if the score has dropped below deactivationThreshold
        if (
          rawScore < deactivationThreshold &&
          framesSinceStateChange >= debounceFrames
        ) {
          callback("SPEECH_END");
          resetState();
          logger.silly("Speech end detected", { rawScore });
          continue;
        }
      } else {
        // If currently not speaking, check if the score is above activationThreshold
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

export { createVad, VadParams };
