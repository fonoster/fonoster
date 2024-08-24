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
import { DeepgramVoice } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { SynthOptions, TtsConfig } from "./types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DeepgramClient, createClient } = require("@deepgram/sdk");

const ENGINE_NAME = "tts.deepgram";

type DeepgramTtsConfig = TtsConfig & {
  [key: string]: Record<string, string>;
  credentials: {
    apiKey: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Deepgram extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  client: typeof DeepgramClient;
  engineConfig: DeepgramTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice"];
  protected readonly AUDIO_ENCODING = "linear16" as const;
  protected readonly SAMPLE_RATE_HERTZ = 16000;

  constructor(config: DeepgramTtsConfig) {
    super(config);
    this.client = createClient(config.credentials.apiKey);
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

    const filename = this.createFilename(text, effectiveOptions);

    if (this.fileExists(this.getFullPathToFile(filename))) {
      return this.getFilenameWithoutExtension(filename);
    }

    const response = await this.client.speak.request(
      { text },
      {
        model: voice || DeepgramVoice.AURA_ASTERIA_EN,
        encoding: this.AUDIO_ENCODING,
        sample_rate: this.SAMPLE_RATE_HERTZ,
        container: "none"
      }
    );

    const writeFile = util.promisify(fs.writeFile);

    const audioBuffer = await getAudioBuffer(await response.getStream());

    await writeFile(this.getFullPathToFile(filename), audioBuffer, "binary");

    return this.getFilenameWithoutExtension(filename);
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      voice: z.nativeEnum(DeepgramVoice)
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      apiKey: z.string()
    });
  }
}

// helper function to convert stream to audio buffer
const getAudioBuffer = async (response) => {
  const reader = response.getReader();
  const chunks = [];

  // eslint-disable-next-line no-loops/no-loops, no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
  }

  const dataArray = chunks.reduce(
    (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
    new Uint8Array(0)
  );

  return Buffer.from(dataArray.buffer);
};

export { Deepgram, ENGINE_NAME };
