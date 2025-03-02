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
import { AzureVoice } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { SynthOptions } from "./types";

const ENGINE_NAME = "tts.azure";

type AzureTTSConfig = {
  [key: string]: Record<string, string>;
  credentials: {
    subscriptionKey: string;
    serviceRegion: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Azure extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  config: AzureTTSConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice"];

  constructor(config: AzureTTSConfig) {
    super();
    this.config = config;
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

    const { subscriptionKey, serviceRegion } = this.config.credentials;

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );

    speechConfig.speechSynthesisVoiceName = options.voice;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    const isSSML = isSsml(text);
    const func = isSSML ? "speakSsmlAsync" : "speakTextAsync";

    const audioData = await new Promise<Buffer>((resolve, reject) => {
      const audioChunks: Buffer[] = [];

      synthesizer[func](
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            audioChunks.push(Buffer.from(result.audioData));
            resolve(Buffer.concat(audioChunks));
          } else {
            reject(
              new Error("Speech synthesis canceled: " + result.errorDetails)
            );
          }
          synthesizer.close();
        },
        (err: string) => {
          synthesizer.close();
          reject(new Error(err));
        }
      );
    });

    const ref = this.createMediaReference();
    const stream = Readable.from(audioData);

    return { ref, stream };
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      voice: z.nativeEnum(AzureVoice, { message: "Invalid Azure voice" })
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      subscriptionKey: z.string(),
      serviceRegion: z.string()
    });
  }
}

export { Azure, ENGINE_NAME };
