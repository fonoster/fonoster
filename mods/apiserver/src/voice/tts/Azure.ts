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
import { getLogger } from "@fonoster/logger";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AbstractTextToSpeech } from "./AbstractTextToSpeech";
import { computeFilename } from "./computeFilename";
import { isSsml } from "./isSsml";
import { SynthOptions, TtsConfig } from "./types";

const ENGINE_NAME = "azure";
const OUTPUT_FORMAT = "sln16";
const CACHING_FIELDS = ["voice"];

type AzureTTSConfig = TtsConfig & {
  credentials: {
    subscriptionKey: string;
    serviceRegion: string;
  };
};

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Azure extends AbstractTextToSpeech<typeof ENGINE_NAME> {
  cfg: AzureTTSConfig;
  pathToFiles: string;
  readonly engineName = ENGINE_NAME;

  constructor(config: AzureTTSConfig) {
    super(config);
    this.cfg = config;
  }

  async synthesize(text: string, options: SynthOptions): Promise<string> {
    logger.verbose(
      `synthesize [input: ${text}, isSsml=${isSsml(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      this.cfg.credentials.subscriptionKey,
      this.cfg.credentials.serviceRegion
    );

    speechConfig.speechSynthesisVoiceName = options.voice;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    const filename = computeFilename({
      text,
      options,
      cachingFields: CACHING_FIELDS,
      format: OUTPUT_FORMAT
    });

    await this.doSynthesize({
      text,
      filename: `${this.cfg.pathToFiles}/${filename}`,
      speechConfig,
      isSSML: isSsml(text)
    });

    return filename.replace(`.${OUTPUT_FORMAT}`, "");
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
}

export { Azure, ENGINE_NAME };
