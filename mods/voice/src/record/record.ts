/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import objectid from "bson-objectid";
import { Verb } from "../verb";
import { RecordOptions, RecordResult } from "./types";
import { objectToQString } from "../utils";
import { assertsFinishOnKeyIsChar, assertsValueIsPositive } from "../asserts";
import PubSub from "pubsub-js";

export default class RecordVerb extends Verb {
  run(options: RecordOptions = {}): Promise<RecordResult> {
    assertsFinishOnKeyIsChar(options.finishOnKey);
    assertsValueIsPositive("maxSilence", options.maxSilence);
    assertsValueIsPositive("maxDuration", options.maxDuration);
    const name = objectid();

    // Renaming properties to match the API query parameters
    const opts = {
      format: "wav",
      name,
      maxSilenceSeconds: options.maxSilence,
      maxDurationSeconds: options.maxDuration,
      beep: options.beep,
      terminateOn: encodeURIComponent(options.finishOnKey || "#")
    };

    return new Promise(async (resolve, reject) => {
      let tokenFinished = null;
      let tokenFailed = null;
      try {
        await super.post(
          `channels/${this.request.sessionId}/record`,
          objectToQString(opts)
        );

        tokenFinished = PubSub.subscribe(
          `RecordingFinished.${name}`,
          (type, data) => {
            resolve(data.data);
            PubSub.unsubscribe(tokenFinished);
            PubSub.unsubscribe(tokenFailed);
          }
        );

        tokenFailed = PubSub.subscribe(
          `RecordingFailed.${name}`,
          (type, data) => {
            reject("recording failed: " + data.cause);
            PubSub.unsubscribe(tokenFinished);
            PubSub.unsubscribe(tokenFailed);
          }
        );
      } catch (e) {
        reject(e);
        PubSub.unsubscribe(tokenFinished);
        PubSub.unsubscribe(tokenFailed);
      }
    });
  }
}

export { RecordOptions, RecordResult };
