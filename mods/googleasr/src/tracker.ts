/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import {GoogleSpeechConfig, TrackerConfig} from "./types";
import {SpeechTracker, SpeechResult} from "@fonos/common";
import {Stream} from "stream";
import speech from "@google-cloud/speech";

const defaultTrackerConfig = {
  config: {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-US"
  },
  interimResults: false
};

export class GoogleSpeechTracker implements SpeechTracker {
  client: any;
  config: TrackerConfig;
  constructor(config: GoogleSpeechConfig) {
    const merge = require("deepmerge");
    this.config = merge(defaultTrackerConfig, {config} || {});
    this.client = new speech.SpeechClient(this.config.config);
  }

  transcribe(stream: Stream): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      const recognizeStream = this.client
        .streamingRecognize(this.config)
        .on("error", (e: Error) => reject(e))
        .on("data", (data: Record<string, unknown>) => {
          if (data.results[0] && data.results[0].alternatives[0]) {
            const result = {
              transcription: data.results[0].alternatives[0].transcript
            };
            resolve(result);
            return;
          }
        });

      stream.pipe(recognizeStream);
    });
  }
}
