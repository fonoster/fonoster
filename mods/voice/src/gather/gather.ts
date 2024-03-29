/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { SpeechProvider } from "@fonoster/common";
import { assertsFinishOnKeyIsChar, assertsValueIsPositive } from "../asserts";
import { VoiceRequest } from "../types";
import { Verb } from "../verb";
import { GatherOptions } from "./types";
import { getLogger } from "@fonoster/logger";
import merge from "deepmerge";
import waitForDtmf from "./source_dtmf";
import waitForSpeech from "./source_speech";

const defaultOptions: GatherOptions = {
  finishOnKey: "#",
  source: "dtmf"
};

const logger = getLogger({ service: "voice", filePath: __filename });

export default class GatherVerb extends Verb {
  speechProvider: SpeechProvider;
  constructor(request: VoiceRequest, speechProvider?: SpeechProvider) {
    super(request);
    this.speechProvider = speechProvider;
  }

  async run(opts: GatherOptions): Promise<string> {
    const options = merge(defaultOptions, opts);

    // assertsHasNumDigitsOrTimeout(options);
    // assertsValuesIsZeroOrGreater("timeout", options.timeout);
    assertsValueIsPositive("numDigits", options.numDigits);
    assertsFinishOnKeyIsChar(options.finishOnKey);

    options.timeout =
      !options.timeout && options.source.includes("speech")
        ? 10000
        : options.timeout || 4000;

    return new Promise(async (resolve, reject) => {
      logger.verbose("waiting for input", { options });

      if (options.source.includes("dtmf")) {
        waitForDtmf(this.request.sessionId, options)
          .then(resolve)
          .catch(reject);
      }

      // TODO: We should explicitly clean this resources if the
      // other "source" already resolved the request.
      if (options.source.includes("speech")) {
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

export { GatherOptions };
