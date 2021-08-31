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
import {VoiceRequest} from "../types";
import {Verb} from "../verb";
import {SGatherOptions, SGatherStream} from "./types";
import logger from "@fonos/logger";
import merge from "deepmerge";

const defaultOptions: SGatherOptions = {
  source: "speech,dtmf"
};

export default class SGatherVerb extends Verb {
  speechProvider: SpeechProvider;
  constructor(request: VoiceRequest, speechProvider?: SpeechProvider) {
    super(request);
    this.speechProvider = speechProvider;
  }

  async run(opts: SGatherOptions): Promise<SGatherStream> {
    const options = merge(defaultOptions, opts);

    return new Promise(async (resolve, reject) => {
      logger.verbose(
        `@fonos/voice started sgather [sources = ${options.source}]`
      );
      if (options.source.includes("dtmf")) {
        // TODO: Subscribe to dtmf events 
      }

      if (options.source.includes("speech")) {
        // TODO: Listen to speech and convert to text
      }
    });
  }
}

export {SGatherOptions};
