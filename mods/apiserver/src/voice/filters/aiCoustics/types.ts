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

// The slice of @ai-coustics/aic-sdk this filter uses. Declared here so the
// filter can be tested with a fake SDK, and so the real package stays an
// optional dependency.

// Values of the SDK's ProcessorParameter enum
const BYPASS_PARAMETER = 0;
const ENHANCEMENT_LEVEL_PARAMETER = 1;

type AiCousticsContext = {
  setParameter(parameter: number, value: number): void;
  getParameter(parameter: number): number;
  // Algorithmic delay plus buffering, in samples
  getAudioDelay(): number;
  reset(): void;
};

type AiCousticsProcessor = {
  withConfig(
    sampleRate: number,
    blockSize: number,
    variableBlockSize?: boolean
  ): Promise<AiCousticsProcessor>;
  process(audio: Float32Array): Promise<Float32Array>;
  // Async on ProcessorAsync, unlike the synchronous Processor
  getContext(): Promise<AiCousticsContext>;
  dispose(): void;
};

type AiCousticsModel = {
  getOptimalSampleRate(): number;
  getOptimalBlockSize(sampleRate: number): number;
  dispose?(): void;
};

type AiCousticsSdk = {
  Model: {
    fromFile(path: string): AiCousticsModel;
    download(modelId: string, downloadDir: string): Promise<string>;
  };
  ProcessorAsync: new (
    model: AiCousticsModel,
    licenseKey: string
  ) => AiCousticsProcessor;
};

export {
  AiCousticsContext,
  AiCousticsModel,
  AiCousticsProcessor,
  AiCousticsSdk,
  BYPASS_PARAMETER,
  ENHANCEMENT_LEVEL_PARAMETER
};
