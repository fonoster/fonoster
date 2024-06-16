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
import { Stream } from "stream";
import { SpeechClient } from "@google-cloud/speech";
import { AbstractSpeechToText } from "./AbstractSpeechToText";
import { GoogleSttConfig, SpeechResult, StreamSpeechResult } from "./types";

const ENGINE_NAME = "google";
const AUDIO_ENCODING = "LINEAR16";
const SAMPLE_RATE_HERTZ = 16000;

class Google extends AbstractSpeechToText<typeof ENGINE_NAME> {
  client: SpeechClient;
  config: GoogleSttConfig;
  readonly engineName = ENGINE_NAME;
  protected readonly AUDIO_ENCODING = AUDIO_ENCODING;
  protected readonly SAMPLE_RATE_HERTZ = SAMPLE_RATE_HERTZ;

  constructor(config: GoogleSttConfig) {
    super(config);
    this.client = new SpeechClient(config);
    this.config = {
      ...config,
      config: {
        encoding: AUDIO_ENCODING,
        sampleRateHertz: SAMPLE_RATE_HERTZ,
        interimResults: false,
        languageCode: config.languageCode
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  streamTranscribe(_: Stream): StreamSpeechResult {
    // Not implemented
    return null as unknown as StreamSpeechResult;
  }

  async transcribe(stream: Stream): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      const recognizeStream = this.client
        .streamingRecognize(this.config)
        .on("error", (e: Error) => reject(e))
        .on("data", (data: Record<string, unknown>) => {
          if (data.results[0]?.alternatives[0]) {
            const result = {
              speech: data.results[0].alternatives[0].transcript,
              isFinal: true
            };
            resolve(result);
          } else {
            resolve({ speech: "", isFinal: true });
          }
          recognizeStream.destroy();
        });
      stream.pipe(recognizeStream);
    });
  }
}

export { Google, ENGINE_NAME };
