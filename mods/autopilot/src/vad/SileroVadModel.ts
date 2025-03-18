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
import { readFileSync } from "fs";
import {
  ONNXRuntimeAPI,
  ONNXSession,
  ONNXTensor,
  SpeechProbabilities
} from "./types";

const SAMPLE_RATE = 16000;

function getNewState(ortInstance: ONNXRuntimeAPI) {
  return new ortInstance.Tensor(
    "float32",
    new Float32Array(2 * 1 * 128), // Use Float32Array for consistency
    [2, 1, 128]
  );
}

class SileroVadModel {
  private _session: ONNXSession;
  private _state: ONNXTensor;
  private _sr: ONNXTensor;

  constructor(
    private readonly ort: ONNXRuntimeAPI,
    private readonly pathToModel: string
  ) {}

  static readonly new = async (ort: ONNXRuntimeAPI, pathToModel: string) => {
    const model = new SileroVadModel(ort, pathToModel);
    await model.init();
    return model;
  };

  async init() {
    const modelArrayBuffer = readFileSync(this.pathToModel).buffer;
    const sessionOption = {
      interOpNumThreads: 1,
      intraOpNumThreads: 1,
      enableCpuMemArena: false
    };

    this._session = await this.ort.InferenceSession.create(
      modelArrayBuffer,
      sessionOption
    );

    // Validate model inputs/outputs
    const requiredInputs = ["input", "state", "sr"];
    for (const name of requiredInputs) {
      if (!this._session.inputNames.includes(name)) {
        throw new Error(`Model is missing expected input "${name}"`);
      }
    }
    if (
      !this._session.outputNames.includes("output") ||
      !this._session.outputNames.includes("stateN")
    ) {
      throw new Error("Model is missing expected outputs");
    }

    // Use BigInt for sample rate tensor
    this._sr = new this.ort.Tensor("int64", [BigInt(SAMPLE_RATE)], []);
    this._state = getNewState(this.ort);
  }

  resetState = () => {
    this._state = getNewState(this.ort);
  };

  async process(audioFrame: Float32Array): Promise<SpeechProbabilities> {
    const inputTensor = new this.ort.Tensor("float32", audioFrame, [
      1,
      audioFrame.length
    ]);

    const feeds = {
      input: inputTensor,
      state: this._state,
      sr: this._sr
    };

    const out = await this._session.run(feeds);
    this._state = out.stateN;

    const [isSpeech] = out.output.data;
    const notSpeech = 1 - isSpeech;

    return { notSpeech, isSpeech };
  }
}

export { SileroVadModel };
