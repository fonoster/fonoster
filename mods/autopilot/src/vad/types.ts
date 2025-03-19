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

export interface SpeechProbabilities {
  notSpeech: number;
  isSpeech: number;
}

export interface ONNXRuntimeAPI {
  InferenceSession: {
    create: (
      modelPath: ArrayBuffer | string,
      options?: {
        interOpNumThreads: number;
        intraOpNumThreads: number;
        enableCpuMemArena: boolean;
      }
    ) => Promise<ONNXSession>;
  };
  Tensor: new (
    type: string,
    data: Float32Array | bigint[],
    dims: number[]
  ) => ONNXTensor;
}

export interface ONNXSession {
  run: (feeds: { [key: string]: ONNXTensor }) => Promise<{
    output: { data: Float32Array };
    stateN: ONNXTensor;
  }>;
  inputNames: string[];
  outputNames: string[];
}

export interface ONNXTensor {
  data: Float32Array | bigint[];
  dims: number[];
  type: string;
}

export { Vad, VadEvent, VadParams };
