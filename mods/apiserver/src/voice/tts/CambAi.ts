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
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { CambAiTtsConfig, SynthOptions } from "./types";
import { createChunkedSynthesisStream } from "./utils/createChunkedSynthesisStream";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const ENGINE_NAME = "tts.cambai";

// CAMB AI streaming TTS endpoint
const CAMB_AI_TTS_STREAM_URL = "https://client.camb.ai/apis/tts-stream";

class CambAi extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  engineConfig: CambAiTtsConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice", "model", "language", "text"];

  constructor(config: CambAiTtsConfig) {
    super();
    this.engineConfig = config;
  }

  synthesize(
    text: string,
    options: SynthOptions
  ): { ref: string; stream: Readable } {
    this.logSynthesisRequest(text, options);

    const { voice, model, language } = this.engineConfig.config;
    const ref = this.createMediaReference();

    const stream = createChunkedSynthesisStream(text, async (chunkText) => {
      try {
        const response = await fetch(CAMB_AI_TTS_STREAM_URL, {
          method: "POST",
          headers: {
            "x-api-key": this.engineConfig.credentials.apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: chunkText,
            voice_id: parseInt(voice, 10),
            language: language ?? "en-us",
            speech_model: model ?? "mars-flash",
            output_configuration: { format: "wav" }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `CAMB AI TTS API error ${response.status}: ${errorText}`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        // Skip the 44-byte WAV header to get raw PCM16 data
        return audioBuffer.subarray(44);
      } catch (error) {
        logger.error(`error in CAMB AI synthesis: ${error.message}`, {
          stack: error.stack
        });
        throw error;
      }
    });

    return { ref, stream };
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      voice: z.string().optional(),
      model: z.enum(["mars-flash", "mars-pro", "mars-instruct"]).optional(),
      language: z.string().optional()
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      apiKey: z.string()
    });
  }
}

export { ENGINE_NAME, CambAi };
