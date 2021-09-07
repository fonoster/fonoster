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
import fs from "fs";
import util from "util";
import path from "path";
import textToSpeech from "@google-cloud/text-to-speech";
import {Plugin} from "@fonos/common";
import {TTSPlugin, computeFilename, SynthResult} from "@fonos/tts";
import logger from "@fonos/logger";
import {GoogleTTSConfig, SynthOptions} from "./types";

const defaultVoice = {languageCode: "en-US", ssmlGender: "NEUTRAL"};

/**
 * @classdesc Optional TTS engine for Fonos.
 *
 * @extends AbstractTTS
 * @example
 * const GoogleTTS = require("@fonos/googletts");
 *
 * new GoogleTTS().synthetize("Hello world")
 *  .then((result) => console.log("path: " + result.pathToFile))
 *  .catch(console.error);
 */
class GoogleTTS extends Plugin implements TTSPlugin {
  config: GoogleTTSConfig;
  /**
   * Constructs a new GoogleTTS object.
   *
   * @see module:tts:AbstractTTS
   */
  constructor(config: GoogleTTSConfig) {
    super("tts", "googletts");
    this.config = config;
    this.config.path = config.path ? config.path : "/tmp";
  }

  /**
   * @inherit
   */
  async synthetize(
    text: string,
    options: SynthOptions = {}
  ): Promise<SynthResult> {
    const client = new textToSpeech.TextToSpeechClient(this.config as any);
    // TODO: The file extension should be set based on the sample rate
    // For example, if we set the sample rate to 16K, then the extension needs to be
    // snl16, for 8K => sln, etc...
    const filename = computeFilename(text, options, "sln24");
    const pathToFile = path.join(this.config.path, filename);

    logger.verbose(
      `@fonos/tts.GoogleTTS.synthesize [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    );

    const merge = require("deepmerge");
    const voice = merge(defaultVoice, options || {});

    const request = {
      voice,
      input: {text},
      audioConfig: {audioEncoding: "LINEAR16"}
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request as any);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(pathToFile, response.audioContent, "binary");
    return {filename, pathToFile};
  }
}

export default GoogleTTS;

// WARNING: Workaround to support commonjs clients
module.exports = GoogleTTS;
