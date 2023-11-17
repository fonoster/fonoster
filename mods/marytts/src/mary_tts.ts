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
import https from "https";
import fs from "fs";
import { optionsToQueryString, SynthResult, AbstractTTS } from "@fonoster/tts";
import { MaryTTSConfig, MarySynthOptions } from "./types";
import logger from "@fonoster/logger";

/**
 * @classdesc The default TTS engine in a Fonoster deployment.
 *
 * @extends Plugin
 * @example
 *
 * const MaryTTS = require("@fonoster/marytts");
 *
 * new MaryTTS().synthesize("Hello world")
 *  .then((result) => console.log("path: " + result.pathToFile))
 *  .catch(console.err);
 */
export default class MaryTTS extends AbstractTTS {
  serviceUrl: string;
  /**
   * Constructs a new MaryTTS object.
   *
   * @see module:tts:TTSPlugin
   * @param {DefaultConfig} config - Configuration of the marytts
   */
  constructor(config: MaryTTSConfig) {
    super("tts", "marytts", config);
    this.init(config);
  }

  /**
   * Init of the marytts constructor
   *
   * @param {DefaultConfig} config - Configuration of the marytts
   */
  init(config: MaryTTSConfig): void {
    const q = "INPUT_TYPE=TEXT&AUDIO=WAVE_FILE&OUTPUT_TYPE=AUDIO";
    this.serviceUrl = `${config.url}?${q}`;

    logger.debug(
      `@fonoster/tts.MaryTTS.constructor [initializing with config: ${JSON.stringify(
        config
      )}]`
    );
  }

  /**
   * @inherit
   *
   * @param {string} text - Text that will be synthesized
   * @param {OptionsInterface} options - Options of the marytts, locale and voice
   * @param {string} filename - Text that will be synthesized
   * @param {string} pathToFile - Options of the marytts, locale and voice
   * @return {Promise<String>}
   * For more information check the following link: http://marytts.phonetik.uni-muenchen.de:59125/documentation.html
   * WARNING: On windows the command "which" that sox library uses is not the same. In windows is "where" instead
   */
  async synthesizeSpeech(
    text: string,
    options: any,
    filename: string,
    pathToFile: string
  ): Promise<SynthResult> {
    if (Object.keys(options).length === 0) {
      options = { locale: "EN_US" } as MarySynthOptions;
    }
    logger.verbose(
      `@fonoster/tts.MaryTTS.synthesize [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    );

    return new Promise((resolve, reject) => {
      const q = optionsToQueryString(options);
      const query = q ? q.toUpperCase() : "";
      let headers = null;
      const conf = this.config as MaryTTSConfig;
      if (conf.accessKeyId && conf.accessKeySecret) {
        headers = {
          "X-Session-Token": conf.accessKeySecret
        };
      }

      logger.silly(
        `@fonoster/tts.MaryTTS.synthesize [headers: ${JSON.stringify(headers)}]`
      );
      logger.verbose(`@fonoster/tts.MaryTTS.synthesize [query: ${query}]`);

      https.get(
        `${this.serviceUrl}&INPUT_TEXT=${encodeURI(text)}&${query}`,
        {
          headers
        },
        (response) => {
          const { statusCode } = response;

          if (statusCode !== 200) {
            reject(new Error(`Request failed with status code: ${statusCode}`));
            return;
          }
          response.pipe(fs.createWriteStream(pathToFile));
          resolve({ filename, pathToFile });
        }
      );
    });
  }
}

// WARNING: Workaround to support commonjs clients
module.exports = MaryTTS;
