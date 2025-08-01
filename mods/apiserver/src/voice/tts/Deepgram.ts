/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import { createClient, DeepgramClient } from "@deepgram/sdk";
import { DeepgramVoice } from "@fonoster/common";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { DeepgramTtsConfig, SynthOptions } from "./types";
import { createChunkedSynthesisStream } from "./utils/createChunkedSynthesisStream";
import { streamToBuffer } from "./utils/streamToBuffer";

const ENGINE_NAME = "tts.deepgram";

class Deepgram extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  client: DeepgramClient;
  engineConfig: DeepgramTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice"];
  protected readonly AUDIO_ENCODING = "linear16" as const;
  protected readonly SAMPLE_RATE_HERTZ = 8000;

  constructor(config: DeepgramTtsConfig) {
    super();
    this.client = createClient(config.credentials.apiKey);
    this.engineConfig = config;
  }

  synthesize(
    text: string,
    options: SynthOptions
  ): { ref: string; stream: Readable } {
    this.logSynthesisRequest(text, options);

    const { voice } = this.engineConfig.config;
    const ref = this.createMediaReference();
    const selectedVoice =
      (voice as DeepgramVoice) || DeepgramVoice.AURA_ASTERIA_EN;

    const stream = createChunkedSynthesisStream(text, async (chunkText) => {
      const response = await this.client.speak.request(
        { text: chunkText },
        {
          model: selectedVoice,
          encoding: this.AUDIO_ENCODING,
          sample_rate: this.SAMPLE_RATE_HERTZ,
          container: "none"
        }
      );

      return (await streamToBuffer(
        await response.getStream()
      )) as unknown as Readable;
    });

    return { ref, stream };
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      voice: z.nativeEnum(DeepgramVoice, { message: "Invalid Deepgram voice" })
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      apiKey: z.string()
    });
  }
}

export { Deepgram, ENGINE_NAME };
