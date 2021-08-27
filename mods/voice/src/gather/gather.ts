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
import {SpeechProvider} from "@fonos/common";
import merge from "deepmerge";
import {assertsFinishOnKeyIsChar, assertsValueIsPositive} from "../asserts";
import {VoiceRequest} from "../types";
import {Verb} from "../verb";
import {assertsHasNumDigitsOrTimeout} from "./asserts";
import waitForDtmf from "./source_dtmf";
import waitForSpeech from "./source_speech";
import {GatherOptions} from "./types";
import logger from "@fonos/logger";

const defaultOptions: GatherOptions = {
  timeout: 4000,
  finishOnKey: "#",
  source: "dtmf"
};

export default class GatherVerb extends Verb {
  speechProvider: SpeechProvider;
  constructor(request: VoiceRequest, speechProvider?: SpeechProvider) {
    super(request);
    this.speechProvider = speechProvider;
  }

  async run(opts: GatherOptions): Promise<string> {
    const options = merge(defaultOptions, opts);

    assertsHasNumDigitsOrTimeout(options);
    // assertsValuesIsZeroOrGreater("timeout", options.timeout);
    assertsValueIsPositive("numDigits", options.numDigits);
    assertsFinishOnKeyIsChar(options.finishOnKey);

    if (options.source.includes("speech")) options.timeout = 10000;

    return new Promise(async (resolve, reject) => {
      if (options.source.includes("dtmf")) {
        logger.verbose("@fonos/voice enabled dtmf source");
        waitForDtmf(this.request.sessionId, options)
          .then(resolve)
          .catch(reject);
      }

      // TODO: We should explicitly clean this resources if the
      // other "source" already resolved the request.
      if (options.source.includes("speech")) {
        logger.verbose("@fonos/voice enabled speech source");
        waitForSpeech(
          this.request.sessionId,
          options,
          super.getSelf(),
          this.speechProvider
        )
          .then(resolve)
          .catch(reject);
      }
    });
  }
}

export {GatherOptions};
