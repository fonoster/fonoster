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
import { GoogleSpeechTracker } from "./tracker";
import { GoogleSpeechConfig } from "./types";
import { Plugin, SpeechProvider, SpeechTracker } from "@fonoster/common";

const defaultSpeechConfig: GoogleSpeechConfig = {
  languageCode: "en-US"
};

class GoogleASR extends Plugin implements SpeechProvider {
  opts: GoogleSpeechConfig;
  constructor(options: GoogleSpeechConfig) {
    super("asr", "googleasr");
    const merge = require("deepmerge");
    this.opts = merge(defaultSpeechConfig, options || {});
  }

  // This allows to change the speech behavior at the tracker level
  createSpeechTracker(options?: GoogleSpeechConfig): SpeechTracker {
    const merge = require("deepmerge");
    const opt = merge(this.opts, options || {});
    return new GoogleSpeechTracker(opt);
  }
}

export default GoogleASR;
export { GoogleSpeechTracker, GoogleSpeechConfig };

// WARNING: Workaround to support commonjs clients
module.exports = GoogleASR;
module.exports.GoogleSpeechTracker = GoogleSpeechTracker;
