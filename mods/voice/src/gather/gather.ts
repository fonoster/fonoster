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
import { assertsFinishOnKeyIsChar, assertsValueIsPositive, assertsValuesIsZeroOrGreater } from "../asserts";
import {VoiceEventData} from "../types";
import {Verb} from "../verb";
import {
  assertsHasNumDigitsOrTimeout,
} from "./asserts";
import {GatherOptions} from "./types";

const defaultOptions: GatherOptions = {
  timeout: 4000,
  finishOnKey: "#"
};

export default class GatherVerb extends Verb {
  run(opts: GatherOptions): Promise<string> {
    const options = merge(defaultOptions, opts);
    
    assertsHasNumDigitsOrTimeout(options);
    assertsValuesIsZeroOrGreater("timeout", options.timeout);
    assertsValueIsPositive("numDigits", options.numDigits);
    assertsFinishOnKeyIsChar(options.finishOnKey);

    return new Promise(async (resolve, reject) => {
      try {
        let timer;
        let digits = "";

        if (options.timeout) {
          timer = setTimeout(() => {
            resolve(digits);
          }, options.timeout);
        }

        this.events.subscribe((event: VoiceEventData) => {
          if (event.type === "DtmfReceived") {
            if (timer) {
              clearTimeout(timer);
              timer = setTimeout(() => {
                resolve(digits);
              }, options.timeout);
            }
            // We don't need to include finishOnKey
            if (options.finishOnKey != event.data) {
              digits += event.data;
            }
          } else {
            reject("Unexpected event: " + event.type);
          }

          if (
            digits.length >= options.numDigits ||
            event.data === options.finishOnKey
          ) {
            resolve(digits);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

export {GatherOptions};
