import { GoogleSpeechConfig } from "./types";
import { SpeechTracker, SpeechResult } from "@fonos/common";
import speech from "@google-cloud/speech";
import { Stream } from "stream";

export class GoogleSpeechTracker implements SpeechTracker {
  client: any;
  config: GoogleSpeechConfig;
  constructor(config: GoogleSpeechConfig) {
    this.client = new speech.SpeechClient();
    this.config = config;
  }

  transcribe(stream: Stream): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      const recognizeStream = this.client
        .streamingRecognize(this.config)
        .on("error", (e) => reject(e))
        .on("data", (data) => {
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
