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
import fs from "fs";
import util from "util";
import textToSpeech, {v1} from "@google-cloud/text-to-speech";
import { SynthResult, AbstractTTS } from "@fonoster/tts";
import logger from "@fonoster/logger";
import { GoogleTTSConfig } from "./types";
import { isSSML } from "./utils";
const merge = require("deepmerge");

const defaultVoice = { languageCode: "en-US", ssmlGender: "NEUTRAL" };

/**
 * @classdesc Optional TTS engine for Fonoster.
 *
 * @extends AbstractTTS
 * @example
 * const GoogleTTS = require("@fonoster/googletts");
 *
 * new GoogleTTS().synthesize("Hello world")
 *  .then((result) => console.log("path: " + result.pathToFile))
 *  .catch(console.error);
 */
class GoogleTTS extends AbstractTTS {
  client: v1.TextToSpeechClient;
  /**
   * Constructs a new GoogleTTS object.
   *
   * @see module:tts:AbstractTTS
   */
  constructor(config: GoogleTTSConfig) {
    super("tts", "googletts", config);
    this.client = new textToSpeech.TextToSpeechClient(config as any);
  }
  /**
   * @inherit
   */
  async synthesizeSpeech(text: string, options: any, filename: string, pathToFile: string): Promise<SynthResult> {
    logger.verbose(
      `@fonoster/tts.GoogleTTS.synthesize [input: ${text}, isSSML=${isSSML(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const voice = merge(defaultVoice, options || {});
    const input = isSSML(text) ? { ssml: text } : { text: text };

    const request = {
      voice,
      input,
      audioConfig: { audioEncoding: "LINEAR16" }
    };

    // Performs the text-to-speech request
    const [response] = await this.client.synthesizeSpeech(request as any);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(pathToFile, response.audioContent, "binary");
    return { filename, pathToFile };
  }
}

export default GoogleTTS;

// WARNING: Workaround to support commonjs clients
module.exports = GoogleTTS;
