/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import merge from "deepmerge";
import {
  assertsFinishOnKeyIsChar,
  assertsValueIsPositive,
  assertsValuesIsZeroOrGreater
} from "../asserts";
import { Verb } from "../verb";
import { assertsHasNumDigitsOrTimeout } from "./asserts";
import waitForDtmf from "./source_dtmf";
import waitForSpeech from "./source_speech";
import { GatherOptions } from "./types";

const defaultOptions: GatherOptions = {
  timeout: 4000,
  finishOnKey: "#",
  source: "dtmf"
};

export default class GatherVerb extends Verb {
  async run(opts: GatherOptions): Promise<string> {
    const options = merge(defaultOptions, opts);

    assertsHasNumDigitsOrTimeout(options);
    assertsValuesIsZeroOrGreater("timeout", options.timeout);
    assertsValueIsPositive("numDigits", options.numDigits);
    assertsFinishOnKeyIsChar(options.finishOnKey);

    return new Promise(async (resolve, reject) => {
      if (options.source.includes("dtmf")) {
        waitForDtmf(this.request.sessionId, options).then(text => {
          resolve(text);
        }).catch(e => {
          reject(e);
        })
      }

      if (options.source.includes("speech")) {
        waitForSpeech(this.request.sessionId, options, super.getSelf()).then(text => {
          resolve(text);
        }).catch(e => {
          reject(e);
        })
      }
    })
  }
}

export { GatherOptions };
