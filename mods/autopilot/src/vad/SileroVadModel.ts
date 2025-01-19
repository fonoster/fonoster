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

class SileroVadModel {
  _session;
  _h: unknown;
  _c: unknown;
  _sr: unknown;

  constructor(
    private ort: ONNXRuntimeAPI,
    private pathToModel: string
  ) {}

  static new = async (ort: ONNXRuntimeAPI, pathToModel: string) => {
    const model = new SileroVadModel(ort, pathToModel);
    await model.init();
    return model;
  };

  async init() {
    const modelArrayBuffer = readFileSync(this.pathToModel).buffer;
    this._session = await this.ort.InferenceSession.create(modelArrayBuffer);
    this._sr = new this.ort.Tensor("int64", [16000n]);
    this.resetState();
  }

  async process(audioFrame: Float32Array): Promise<SpeechProbabilities> {
    const t = new this.ort.Tensor("float32", audioFrame, [
      1,
      audioFrame.length
    ]);
    const inputs = {
      input: t,
      h: this._h,
      c: this._c,
      sr: this._sr
    };
    const out = await this._session.run(inputs);
    this._h = out.hn;
    this._c = out.cn;
    const [isSpeech] = out.output.data;
    const notSpeech = 1 - isSpeech;

    return { notSpeech, isSpeech };
  }

  resetState() {
    const zeroes = Array(2 * 64).fill(0);
    this._h = new this.ort.Tensor("float32", zeroes, [2, 1, 64]);
    this._c = new this.ort.Tensor("float32", zeroes, [2, 1, 64]);
  }
}

export { SileroVadModel };
