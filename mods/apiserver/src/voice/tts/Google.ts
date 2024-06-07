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
import { computeFilename } from "./computeFilename";

type SynthOptions = {
  voice: string;
};

type GoogleTtsConfig = {
  pathToFiles: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
};

const CACHING_FIELDS = ["voice"];

class Google {
  client: TextToSpeechClient;
  pathToFiles: string;
  constructor(config: GoogleTtsConfig) {
    this.client = new TextToSpeechClient(config);
    this.pathToFiles = config.pathToFiles;
  }

  async synthesize(text: string, options: SynthOptions) {
    const lang = `${options.voice.split("-")[0]}-${options.voice.split("-")[1]}`;
    const filename = computeFilename({
      text,
      options,
      cachingFields: CACHING_FIELDS,
      format: "sln16"
    });

    const request = {
      input: { text },
      audioConfig: {
        audioEncoding: "LINEAR16" as const,
        sampleRateHertz: 16000
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

    return filename.replace(".sln16", "");
  }
}

export { Google };
