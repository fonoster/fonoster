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
import { SynthResult, AbstractTTS } from "@fonoster/tts";
import { GoogleTTSConfig } from "./types";
import { isSSML } from "./utils";
import textToSpeech, { v1 } from "@google-cloud/text-to-speech";
import fs from "fs";
import util from "util";
import { getLogger } from "@fonoster/logger";

const merge = require("deepmerge");
const defaultVoice = { languageCode: "en-US" };

const logger = getLogger({ service: "googletts", filePath: __filename });

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
export default class GoogleTTS extends AbstractTTS {
  client: v1.TextToSpeechClient;
  /**
   * Constructs a new GoogleTTS object.
   *
   * @see module:tts:AbstractTTS
   */
  constructor(config: GoogleTTSConfig) {
    super("tts", "googletts", config);
    const credentials = {
      private_key: config.credentials?.privateKey,
      client_email: config.credentials?.clientEmail
    };
    this.client = new textToSpeech.TextToSpeechClient({ credentials });
  }

  /**
   * @inherit
   */
  async synthesizeSpeech(
    text: string,
    options: any,
    filename: string,
    pathToFile: string
  ): Promise<SynthResult> {
    logger.verbose(
      `synthesize [input: ${text}, isSSML=${isSSML(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const voice = merge(defaultVoice, options || {});
    const input = isSSML(text) ? { ssml: text } : { text: text };

    const request = {
      voice,
      input,
      audioConfig: {
        audioEncoding: "LINEAR16",
        sampleRateHertz: 16000
      }
    };

    // Performs the text-to-speech request
    const [response] = await this.client.synthesizeSpeech(request as any);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(pathToFile, response.audioContent, "binary");
    return { filename, pathToFile };
  }
}
