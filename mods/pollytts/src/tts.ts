/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
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
import * as AWS from "@aws-sdk/client-polly";
import { computeFilename, SynthResult, AbstractTTS } from "@fonoster/tts";
import { PollyTTSConfig, SynthOptions } from "./types";
import { LanguageCode, TextType, Voice, Engine, Region } from "./enums";
import { OutputFormat } from "@aws-sdk/client-polly";
import { getLogger } from "@fonoster/logger";
import fs from "fs";
import os from "os";
import path from "path";

const logger = getLogger({ service: "pollytts", filePath: __filename });

const defaultVoice = {
  voice: Voice.VITORIA,
  textType: TextType.Text,
  engine: Engine.NEURAL,
  languageCode: LanguageCode.EN_US
};

/**
 * @classdesc Optional TTS engine for Fonoster.
 *
 * @extends AbstractTTS
 * @example
 * const PollyTTS = require("@fonoster/pollytts");
 *
 * new PollyTTS().synthetize("Hello world")
 *  .then((result) => console.log("path: " + result.pathToFile))
 *  .catch(console.error);
 */
class PollyTTS extends AbstractTTS {
  config: PollyTTSConfig;
  client: AWS.Polly;
  /**
   * Constructs a new PollyTTS object.
   *
   * @param {object} config -
   * @see module:tts:AbstractTTS
   */
  constructor(config: PollyTTSConfig) {
    super("tts", "pollytts", config);
    this.config = config;
    this.config.path = config.path ? config.path : os.tmpdir();
    this.config.region = config.region ? config.region : Region.US_EAST_1;
    this.config.accessKeyId = config.accessKeyId;
    this.config.secretAccessKey = config.secretAccessKey;
    this.client = new AWS.Polly({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      region: this.config.region
    });
  }

  // eslint-disable-next-line require-jsdoc
  async synthesizeSpeech(
    text: string,
    options: SynthOptions = {}
  ): Promise<SynthResult> {
    logger.verbose(
      `synthesize [input: ${text}, options: ${JSON.stringify(options)}]`
    );

    const filename = computeFilename(text, options, "sln16");
    const pathToFile = path.join(this.config.path, filename);

    logger.verbose(`text: ${text}`, options);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const merge = require("deepmerge");
    const voice = merge(defaultVoice, options || {});

    const request = {
      VoiceId: voice.voice,
      Engine: voice.engine,
      TextType: voice.textType,
      LanguageCode: voice.languageCode,
      Text: text,
      OutputFormat: OutputFormat.PCM,
      SampleRate: "16000"
    };

    // Performs the text-to-speech request
    const response = await this.client.synthesizeSpeech(request);
    response.AudioStream.pipe(fs.createWriteStream(pathToFile));
    return { filename, pathToFile };
  }
}

export default PollyTTS;
export { Voice, LanguageCode, TextType, Engine };

// WARNING: Workaround to support commonjs clients
module.exports = PollyTTS;
module.exports.Voice = Voice;
module.exports.LanguageCode = LanguageCode;
module.exports.TextType = TextType;
module.exports.Engine = Engine;
