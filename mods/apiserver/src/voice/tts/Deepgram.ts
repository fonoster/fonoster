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
import { Readable } from "stream";
import { DeepgramClient, createClient } from "@deepgram/sdk";
import { DeepgramVoice } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { SynthOptions } from "./types";

const ENGINE_NAME = "tts.deepgram";

type DeepgramTtsConfig = {
  [key: string]: Record<string, string>;
  credentials: {
    apiKey: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Deepgram extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  client: DeepgramClient;
  engineConfig: DeepgramTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice"];
  protected readonly AUDIO_ENCODING = "linear16" as const;
  protected readonly SAMPLE_RATE_HERTZ = 16000;

  constructor(config: DeepgramTtsConfig) {
    super();
    this.client = createClient(config.credentials.apiKey);
    this.engineConfig = config;
  }

  async synthesize(
    text: string,
    options: SynthOptions
  ): Promise<{ ref: string; stream: Readable }> {
    logger.verbose(
      `synthesize [input: ${text}, isSsml=${isSsml(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const { voice } = this.engineConfig.config;

    const response = await this.client.speak.request(
      { text },
      {
        model: voice || DeepgramVoice.AURA_ASTERIA_EN,
        encoding: this.AUDIO_ENCODING,
        sample_rate: this.SAMPLE_RATE_HERTZ,
        container: "none"
      }
    );

    const ref = this.createMediaReference();

    const stream = Readable.from(
      (await response.getStream()) as unknown as Iterable<unknown>
    );

    return { ref, stream };
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

export { Deepgram, ENGINE_NAME };
