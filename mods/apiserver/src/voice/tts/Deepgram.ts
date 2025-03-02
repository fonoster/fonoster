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
import { getLogger } from "@fonoster/logger";
import * as z from "zod";
import { textChunksByFirstNaturalPause } from "../handlers/utils/textChunksByFirstNaturalPause";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { streamToBuffer } from "./streamToBuffer";
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
    const ref = this.createMediaReference();
    const chunks = textChunksByFirstNaturalPause(text);
    const stream = new Readable({ read() {} });

    const results = new Array(chunks.length);
    let nextIndexToPush = 0;

    function observeQueue() {
      if (
        nextIndexToPush < results.length &&
        results[nextIndexToPush] !== undefined
      ) {
        stream.push(results[nextIndexToPush]);
        nextIndexToPush++;
        setImmediate(observeQueue);
      } else if (nextIndexToPush < results.length) {
        setTimeout(observeQueue, 10);
      } else {
        stream.push(null);
      }
    }

    observeQueue();

    chunks.forEach((text, index) => {
      this.doSynthesize(text, voice as DeepgramVoice)
        .then((synthesizedText) => {
          results[index] = synthesizedText;
        })
        .catch((error) => {
          stream.emit("error", error);
        });
    });

    return { ref, stream };
  }

  private async doSynthesize(
    text: string,
    voice: DeepgramVoice
  ): Promise<Readable> {
    const response = await this.client.speak.request(
      { text },
      {
        model: voice || DeepgramVoice.AURA_ASTERIA_EN,
        encoding: this.AUDIO_ENCODING,
        sample_rate: this.SAMPLE_RATE_HERTZ,
        container: "none"
      }
    );

    return (await streamToBuffer(
      await response.getStream()
    )) as unknown as Readable;
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
