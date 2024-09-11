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
import { ElevenLabsVoice } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ElevenLabsClient } from "elevenlabs";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { SynthOptions, TtsConfig } from "./types";

const ENGINE_NAME = "tts.elevenlabs";

type ElevenLabsTtsConfig = TtsConfig & {
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
    super(config);
    this.client = new ElevenLabsClient(config.credentials);
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

    const response = await this.client.generate({
      voice,
      text,
      // TODO: This should be configurable
      model_id: "eleven_turbo_v2_5",
      output_format: "pcm_16000"
    });

    const writable = fs.createWriteStream(this.getFullPathToFile(filename), {
      encoding: "binary"
    });

    await new Promise<void>((resolve, reject) => {
      response.pipe(writable);
      writable.on("finish", resolve);
      writable.on("error", reject);
    });

    return this.getFilenameWithoutExtension(filename);
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      voice: z.nativeEnum(ElevenLabsVoice)
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      apiKey: z.string()
    });
  }
}

export { ENGINE_NAME, ElevenLabs };
