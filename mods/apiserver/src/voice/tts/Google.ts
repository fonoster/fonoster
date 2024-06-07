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
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { computeFilename } from "./computeFilename";
import { isSsml } from "./isSsml";
import { SynthOptions, TtsConfig } from "./types";

const ENGINE_NAME = "google" as const;
const OUTPUT_FORMAT = "sln16" as const;
const AUDIO_ENCODING = "LINEAR16" as const;
const SAMPLE_RATE_HERTZ = 16000;
const CACHING_FIELDS = ["voice"];

type GoogleTtsConfig = TtsConfig & {
  credentials: {
    client_email: string;
    private_key: string;
  };
};

class Google extends AbstractTextToSpeech<SynthOptions, typeof ENGINE_NAME> {
  client: TextToSpeechClient;
  pathToFiles: string;
  readonly engineName = ENGINE_NAME;

  constructor(config: GoogleTtsConfig) {
    super();
    this.client = new TextToSpeechClient(config);
    this.pathToFiles = config.pathToFiles;
  }

  async synthesize(text: string, options: SynthOptions): Promise<string> {
    const lang = `${options.voice.split("-")[0]}-${options.voice.split("-")[1]}`;
    const filename = computeFilename({
      text,
      options,
      cachingFields: CACHING_FIELDS,
      format: OUTPUT_FORMAT
    });

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
      `${this.pathToFiles}/${filename}`,
      response.audioContent,
      "binary"
    );

    return filename.replace(`.${OUTPUT_FORMAT}`, "");
  }
}

export { Google };
