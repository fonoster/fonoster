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
import { getLogger } from "@fonoster/logger";
import { ElevenLabsClient } from "elevenlabs";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { ElevenLabsTtsConfig, SynthOptions } from "./types";
import { convertUlawToPCM16 } from "./utils/convertUlawToPCM16";
import { createChunkedSynthesisStream } from "./utils/createChunkedSynthesisStream";
import { streamToBuffer } from "./utils/streamToBuffer";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const ENGINE_NAME = "tts.elevenlabs";

class ElevenLabs extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  client: ElevenLabsClient;
  engineConfig: ElevenLabsTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16"; // TODO: Ask the team at ElevenLabs to provde PCM 16-bit at 8kHz
  protected readonly CACHING_FIELDS = ["voice", "text"];

  constructor(config: ElevenLabsTtsConfig) {
    super();
    this.client = new ElevenLabsClient(config.credentials);
    this.engineConfig = config;
  }

  synthesize(
    text: string,
    options: SynthOptions
  ): { ref: string; stream: Readable } {
    this.logSynthesisRequest(text, options);

    const { voice, model } = this.engineConfig.config;
    const ref = this.createMediaReference();

    const stream = createChunkedSynthesisStream(text, async (chunkText) => {
      try {
        const response = await this.client.generate(
          {
            stream: true,
            voice,
            text: chunkText,
            model_id: model ?? "eleven_flash_v2_5",
            output_format: "ulaw_8000",
            // TODO: Make this configurable
            optimize_streaming_latency: 2
          },
          {
            maxRetries: 3
          }
        );

        const ulawBuffer = await streamToBuffer(response);
        const pcmBuffer = await convertUlawToPCM16(Readable.from(ulawBuffer));

        return pcmBuffer;
      } catch (error) {
        logger.error(`error in ElevenLabs synthesis: ${error.message}`, {
          stack: error.stack
        });
        throw error;
      }
    });

    return { ref, stream };
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
