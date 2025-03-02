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
type VadEvent = "SPEECH_START" | "SPEECH_END";

type Vad = {
  processChunk: (
    chunk: Uint8Array,
    callback: (event: VadEvent) => void
  ) => void;
};

type VadParams = {
  pathToModel?: string;
  activationThreshold: number;
  deactivationThreshold: number;
  debounceFrames: number;
};

type SpeechProbabilities = {
  notSpeech: number;
  isSpeech: number;
};

type ONNXRuntimeAPI = {
  InferenceSession: {
    create(modelArrayBuffer: ArrayBuffer): Promise<unknown>;
  };
  Tensor: {
    new (type: "int64", dims: [16000n]): unknown;
    new (type: "float32", data: number[], dims: [2, 1, 64]): unknown;
    new (type: "float32", data: Float32Array, dims: [1, number]): unknown;
    new (type: "float32", data: Float32Array, dims: [1, number]): unknown;
  };
};

export { ONNXRuntimeAPI, SpeechProbabilities, Vad, VadParams, VadEvent };
