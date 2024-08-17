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
import { GoogleVoice } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { SynthOptions, TtsConfig } from "./types";

const ENGINE_NAME = "tts.google";
const AUDIO_ENCODING = "LINEAR16" as const;
const SAMPLE_RATE_HERTZ = 16000;

type GoogleTtsConfig = TtsConfig & {
  [key: string]: Record<string, string>;
  credentials: {
    client_email: string;
    private_key: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Google extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  client: TextToSpeechClient;
  engineConfig: GoogleTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice"];
  protected readonly AUDIO_ENCODING = AUDIO_ENCODING;

  constructor(config: GoogleTtsConfig) {
    super(config);
    this.client = new TextToSpeechClient(config);
    this.engineConfig = config;
  }

  async synthesize(text: string, options: SynthOptions): Promise<string> {
    logger.verbose(
      `synthesize [input: ${text}, isSsml=${isSsml(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const effectiveOptions = {
      ...this.engineConfig,
      ...options
    };

    const { voice } = this.engineConfig.config;

    const lang = `${voice.split("-")[0]}-${voice.split("-")[1]}`;

    const filename = this.createFilename(text, effectiveOptions);

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
        name: voice
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

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      voice: z.nativeEnum(GoogleVoice)
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      client_email: z.string(),
      private_key: z.string()
    });
  }
}

export { Google, ENGINE_NAME };
