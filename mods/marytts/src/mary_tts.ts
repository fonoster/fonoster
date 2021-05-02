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
import http from "http";
import fs from "fs";
import path from "path";
import {AbstractTTS, optionsToQueryString, computeFilename} from "@fonos/tts";
import {MaryTTSConfig, MarySynthOptions} from "./types";
import logger from "@fonos/logger";

/**
 * @classdesc The default TTS engine in a Fonos deployment.
 *
 * @extends AbstractTTS
 * @example
 *
 * const MaryTTS = require("@fonos/tts/marytts");
 * const Storage = require("@fonos/storage");
 * const { transcodeSync } = require("@fonos/tts/utils");

 *
 * // This is all done automatically when using the Say verb.
 * module.exports = chan => {
 *    const storage = new Storage();
 *    const tts = new MaryTTS();
 *    const pathToFile = tts.synthesizeSync("Hello World");
 *    const pathToTranscodedFile = transcodeSync(pathToFile);
 *    const url = storage.uploadFileSync("hello-world.wav", pathToTranscodedFile);
 *    chan.play(url);
 * }
 */
export default class MaryTTS extends AbstractTTS {
  serviceUrl: string;
  /**
   * Constructs a new MaryTTS object.
   *
   * @see module:tts:AbstractTTS
   * @param {DefaultConfig} config - Configuration of the marytts
   */
  constructor(config: MaryTTSConfig) {
    super("mary-tts");
    this.init(config);
  }

  /**
   * Init of the marytts constructor
   *
   * @param {DefaultConfig} config - Configuration of the marytts
   */
  init(config: MaryTTSConfig): void {
    const q = `INPUT_TYPE=TEXT&AUDIO=WAVE_FILE&OUTPUT_TYPE=AUDIO&LOCALE=${config.locale}`;
    this.serviceUrl = `http://${config.host}:${config.port}/process?${q}`;

    logger.log(
      "debug",
      `@fonos/tts.MaryTTS.constructor [initializing with config: ${JSON.stringify(
        config
      )}]`
    );

    logger.log(
      "verbose",
      `@fonos/tts.MaryTTS.constructor [serviceUrl: ${this.serviceUrl}]`
    );
  }

  /**
   * @inherit
   *
   * @param {string} text - Text that will be synthesized
   * @param {OptionsInterface} options - Options of the marytts, locale and voice
   * @return {Promise<String>}
   * For more information: http://marytts.phonetik.uni-muenchen.de:59125/documentation.html
   * Advice: On windows the command "which" that sox library uses is not the same. In windows is "where" instead
   */
  synthesize(
    text: string,
    options: MarySynthOptions = {locale: "EN_US", voice: ""}
  ): Promise<string> {
    const pathToFile = path.join("/tmp", computeFilename(text, options));

    logger.log(
      "debug",
      `@fonos/tts.MaryTTS.synthesize [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    );

    return new Promise((resolve, reject) => {
      const query = optionsToQueryString(options);
      http.get(
        `${this.serviceUrl}&INPUT_TEXT=${encodeURI(text)}&${query}`,
        (response) => {
          const {statusCode} = response;

          if (statusCode !== 200) {
            reject(new Error(`Request failed status code: ${statusCode}`));
            return;
          }
          response.pipe(fs.createWriteStream(pathToFile));
          resolve(pathToFile);
        }
      );
    });
  }
}
