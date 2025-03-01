/*
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
import { getLogger } from "@fonoster/logger";
import { ElevenLabsClient } from "elevenlabs";
import * as z from "zod";
import { textChunksByFirstNaturalPause } from "../handlers/utils/textChunksByFirstNaturalPause"; // Assuming this is the chunking function
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { streamToBuffer } from "./streamToBuffer";
import { SynthOptions } from "./types";

const ENGINE_NAME = "tts.elevenlabs";

type ElevenLabsTtsConfig = {
  [key: string]: Record<string, string>;
  credentials: {
    apiKey: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

class ElevenLabs extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  client: ElevenLabsClient;
  engineConfig: ElevenLabsTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice", "text"];

  constructor(config: ElevenLabsTtsConfig) {
    super();
    this.client = new ElevenLabsClient(config.credentials);
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

    const { voice, model } = this.engineConfig.config;
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
      this.doSynthesize({ text, voice, model })
        .then((synthesizedText) => {
          results[index] = synthesizedText;
        })
        .catch((error) => {
          stream.emit("error", error);
        });
    });

    return { ref, stream };
  }

  private async doSynthesize(params: {
    text: string;
    voice: string;
    model: string;
  }): Promise<Readable> {
    const { text, voice, model } = params;
    const response = await this.client.generate({
      stream: true,
      voice,
      text,
      model_id: model ?? "eleven_flash_v2_5",
      output_format: "pcm_16000",
      // TODO: Make this configurable
      optimize_streaming_latency: 2
    });

    return (await streamToBuffer(response)) as unknown as Readable;
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({});
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      apiKey: z.string()
    });
  }
}

export { ENGINE_NAME, ElevenLabs };
