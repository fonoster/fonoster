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
import {GoogleSpeechTracker} from "./tracker";
import {GoogleSpeechConfig} from "./types";
import {Plugin, SpeechProvider, SpeechTracker} from "@fonos/common";

const defaultSpeechConfig: GoogleSpeechConfig = {
  languageCode: "en-US"
};

class GoogleASR extends Plugin implements SpeechProvider {
  constructor() {
    super("asr", "googleasr");
  }

  createSpeechTracker(options: GoogleSpeechConfig): SpeechTracker {
    const merge = require("deepmerge");
    const opts = merge(defaultSpeechConfig, options || {});
    return new GoogleSpeechTracker(opts);
  }
}

export default GoogleASR;
export {GoogleSpeechTracker, GoogleSpeechConfig};
