/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { GoogleSpeechConfig, TrackerConfig } from "./types";
import {
  SpeechTracker,
  SpeechResult,
  StreamSpeechResult
} from "@fonoster/common";
import { Stream } from "stream";
import speech from "@google-cloud/speech";
import StreamRecognize from "./stream_recognize";
import StreamSpeechImpl from "./stream_speech_result";

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
    this.config = merge(defaultTrackerConfig, { config } || {});
    this.client = new speech.SpeechClient(this.config.config);
  }

  streamTranscribe(stream: Stream): StreamSpeechResult {
    let s = new StreamSpeechImpl();
    new StreamRecognize(
      this.config.config,
      stream,
      async (transcript: string, isFinal: boolean) => {
        s.emit({ transcript, isFinal });
      },
      (result) => {
        // We are not yet doing diarization
      }
    );

    return s;
  }

  transcribe(stream: Stream): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      const recognizeStream = this.client
        .streamingRecognize(this.config)
        .on("error", (e: Error) => reject(e))
        .on("data", (data: Record<string, unknown>) => {
          if (data.results[0]?.alternatives[0]) {
            const result = {
              transcript: data.results[0].alternatives[0].transcript,
              isFinal: true
            };
            resolve(result);
          } else {
            resolve({ transcript: "", isFinal: true });
          }
        });
      stream.pipe(recognizeStream);
    });
  }
}
