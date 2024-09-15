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
import { AzureVoice } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import * as z from "zod";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { isSsml } from "./isSsml";
import { SynthOptions, TtsConfig } from "./types";

const ENGINE_NAME = "tts.azure";

type AzureTTSConfig = TtsConfig & {
  [key: string]: Record<string, string>;
  credentials: {
    subscriptionKey: string;
    serviceRegion: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

// XXX: Must re-implement to provide an id an a Readable stream
class Azure extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  config: AzureTTSConfig;
  pathToFiles: string;
  readonly engineName = ENGINE_NAME;
  protected readonly OUTPUT_FORMAT = "sln16";
  protected readonly CACHING_FIELDS = ["voice"];

  constructor(config: AzureTTSConfig) {
    super(config);
    this.config = config;
  }

  async synthesize(
    text: string,
    options: SynthOptions
  ): Promise<{ id: string; stream: Readable }> {
    logger.verbose(
      `synthesize [input: ${text}, isSsml=${isSsml(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const effectiveOptions = {
      ...this.config,
      ...options
    };

    const filename = this.createFilename(text, effectiveOptions);

    const { subscriptionKey, serviceRegion } = this.config.credentials;

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );

    speechConfig.speechSynthesisVoiceName = options.voice;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    await this.doSynthesize({
      text,
      filename: this.getFullPathToFile(filename),
      speechConfig,
      isSSML: isSsml(text)
    });

    const id = this.getFilenameWithoutExtension(filename);

    // TODO: Fix this placeholder
    return { id, stream: new Readable() };
  }

  async doSynthesize(params: {
    text: string;
    filename: string;
    speechConfig: sdk.SpeechConfig;
    isSSML?: boolean;
  }) {
    const { text, filename, speechConfig } = params;
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    // FIXME: Let's turn this into constants
    const func = params.isSSML ? "speakSsmlAsync" : "speakTextAsync";

    return new Promise((resolve, reject) => {
      synthesizer[func](
        text,
        function (result) {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve(filename);
          } else {
            reject(
              new Error("speech synthesis canceled: " + result.errorDetails)
            );
          }
          synthesizer.close();
        },
        function (err: string) {
          synthesizer.close();
          reject(new Error(err));
        }
      );
    });
  }

  getConfigValidationSchema(): z.Schema {
    return z.object({
      voice: z.nativeEnum(AzureVoice)
    });
  }

  getCredentialsValidationSchema(): z.Schema {
    return z.object({
      subscriptionKey: z.string(),
      serviceRegion: z.string()
    });
  }
}

export { Azure, ENGINE_NAME };
