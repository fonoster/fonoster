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
import objectid from "objectid";
import {Verb} from "../verb";
import {RecordOptions, RecordResult} from "./types";
import {objectToQString} from "../utils";
import {assertsFinishOnKeyIsChar, assertsValueIsPositive} from "../asserts";

export default class RecordVerb extends Verb {
  run(options: RecordOptions = {}): Promise<RecordResult> {
    assertsFinishOnKeyIsChar(options.finishOnKey);
    assertsValueIsPositive("maxSilence", options.maxSilence);
    assertsValueIsPositive("maxDuration", options.maxDuration);

    // Renaming properties to match the API query parameters
    const opts = {
      format: "wav",
      name: objectid(),
      maxSilenceSeconds: options.maxSilence,
      maxDurationSeconds: options.maxDuration,
      beep: options.beep,
      terminateOn: encodeURIComponent(options.finishOnKey || "#")
    };

    return new Promise(async (resolve, reject) => {
      try {
        await super.post(
          `channels/${this.request.sessionId}/record`,
          objectToQString(opts)
        );
        this.events.subscribe((event) => {
          if (event.type === "RecordingFinished") resolve(event.data);
          if (event.type === "RecordingFailed")
            reject("recording failed: " + event.cause);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

export {RecordOptions, RecordResult};
