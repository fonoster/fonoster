/* eslint-disable prettier/prettier */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { SynthResult, AbstractTTS } from "@fonoster/tts";
import { AzureTTSConfig } from "./types";
import { isSSML } from "./utils";
import { getLogger } from "@fonoster/logger";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

const logger = getLogger({ service: "azuretts", filePath: __filename });

/**
 * @classdesc Optional TTS engine for Fonoster.
 *
 * @extends AbstractTTS
 * @example
 * const AzureTTS = require("@fonoster/azuretts");
 *
 * new AzureTTS().synthesize("Hello world")
 *  .then((result) => console.log("path: " + result.pathToFile))
 *  .catch(console.error);
 */
export default class AzureTTS extends AbstractTTS {
  cfg: AzureTTSConfig;
  // eslint-disable-next-line require-jsdoc
  constructor(config: AzureTTSConfig) {
    super("tts", "azuretts", config);
    this.cfg = config;
  }

  // eslint-disable-next-line require-jsdoc
  async synthesizeSpeech(
    text: string,
    options: Record<string, unknown>,
    filename: string,
    pathToFile: string
  ): Promise<SynthResult> {
    logger.verbose(
      `synthesize [input: ${text}, isSSML=${isSSML(
        text
      )} options: ${JSON.stringify(options)}]`
    );

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      this.cfg.subscriptionKey,
      this.cfg.serviceRegion
    );
    speechConfig.speechSynthesisVoiceName =
      (options.voice as string) || "en-US-AriaNeural";
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

    const result = await synthesize({
      text,
      filename: pathToFile,
      speechConfig,
      isSSML: isSSML(text)
    });

    logger.verbose(`synthesize [output: ${result}]`, { filename, pathToFile });

    return { filename, pathToFile };
  }
}

// eslint-disable-next-line require-jsdoc
async function synthesize(params: {
  text: string;
  filename: string;
  speechConfig: sdk.SpeechConfig;
  isSSML?: boolean;
}) {
  const { text, filename, speechConfig } = params;
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

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
      function (err) {
        synthesizer.close();
        reject(err);
      }
    );
  });
}
