/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import * as fs from "fs";
import * as util from "util";
import { getLogger } from "@fonoster/logger";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { SynthOptions, TtsConfig } from "./types";

const ENGINE_NAME = "google";
const AUDIO_ENCODING = "LINEAR16" as const;
const SAMPLE_RATE_HERTZ = 16000;

type GoogleTtsConfig = TtsConfig & {
  credentials: {
    client_email: string;
    private_key: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Google extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  client: TextToSpeechClient;
  config: GoogleTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice"];
  protected readonly AUDIO_ENCODING = AUDIO_ENCODING;

  constructor(config: GoogleTtsConfig) {
    super(config);
    this.client = new TextToSpeechClient(config);
    this.config = config;
  }

  async synthesize(text: string, options: SynthOptions): Promise<string> {
    logger.verbose(
      `synthesize [input: ${text}, isSsml=${isSsml(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const lang = `${options.voice.split("-")[0]}-${options.voice.split("-")[1]}`;

    const filename = this.createFilename(text, options);

    if (this.fileExists(this.getFullPathToFile(filename))) {
      return this.getFilenameWithoutExtension(filename);
    }

    const request = {
      input: isSsml(text) ? { ssml: text } : { text },
      audioConfig: {
        audioEncoding: AUDIO_ENCODING,
        sampleRateHertz: SAMPLE_RATE_HERTZ
      },
      voice: {
        languageCode: lang,
        name: options.voice
      }
    };

    const [response] = await this.client.synthesizeSpeech(request);

    const writeFile = util.promisify(fs.writeFile);

    await writeFile(
      this.getFullPathToFile(filename),
      response.audioContent,
      "binary"
    );

    return this.getFilenameWithoutExtension(filename);
  }
}

export { Google, ENGINE_NAME };
