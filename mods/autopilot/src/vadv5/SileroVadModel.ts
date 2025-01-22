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
import { readFileSync } from "fs";
import { ONNXRuntimeAPI, SpeechProbabilities } from "./types";

function getNewState(ortInstance: ONNXRuntimeAPI) {
  const zeroes = Array(2 * 128).fill(0);
  return new ortInstance.Tensor("float32", zeroes, [2, 1, 128]);
}

class SileroVadModel {
  // @ts-ignore
  private _session: any;
  private _state: unknown;
  private _sr: unknown;

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
    const sessionOption = { interOpNumThreads: 1, intraOpNumThreads: 1 };
    this._session = await this.ort.InferenceSession.create(
      modelArrayBuffer,
      sessionOption
    );
    this._sr = new this.ort.Tensor("int64", [16000n]);
    this._state = getNewState(this.ort);
  }

  resetState = () => {
    this._state = getNewState(this.ort);
  };

  async process(audioFrame: Float32Array): Promise<SpeechProbabilities> {
    const t = new this.ort.Tensor("float32", audioFrame, [
      1,
      audioFrame.length
    ]);

    const inputs = {
      input: t,
      state: this._state,
      sr: this._sr
    };

    const out = await this._session.run(inputs);
    this._state = out.stateN;

    const [isSpeech] = out.output.data;
    const notSpeech = 1 - isSpeech;

    return { notSpeech, isSpeech };
  }
}

export { SileroVadModel };
