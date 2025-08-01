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
import { Stream } from "stream";
import { SayOptions } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { AudioStream } from "@fonoster/streams";
import { Client } from "ari-client";
import { SpeechResult } from "../stt/types";
import { AriEvent, SpeechToText, TextToSpeech } from "../types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class SpeechHandler {
  private tts: TextToSpeech;
  private stt: SpeechToText;
  private ari: Client;
  private transcriptionsStream: Stream;
  private audioStream: AudioStream;
  private sessionRef: string;

  constructor(params: {
    tts: TextToSpeech;
    stt: SpeechToText;
    ari: Client;
    transcriptionsStream: Stream;
    audioStream: AudioStream;
    sessionRef: string;
  }) {
    this.tts = params.tts;
    this.stt = params.stt;
    this.ari = params.ari;
    this.transcriptionsStream = params.transcriptionsStream;
    this.audioStream = params.audioStream;
    this.sessionRef = params.sessionRef;
  }

  async synthesize(text: string, options: SayOptions): Promise<string> {
    const { ref, stream } = this.tts.synthesize(text, options);

    logger.verbose("starting audio synthesis", { ref });

    try {
      // Stop any active stream
      this.audioStream.stop();
      await this.audioStream.playStream(stream);
    } catch (error) {
      logger.error(`stream error for ref ${ref}: ${error.message}`, {
        errorDetails: error.stack || "No stack trace"
      });
    }

    return ref;
  }

  async stopSynthesis(): Promise<void> {
    this.audioStream.stop();
  }

  async transcribe(): Promise<SpeechResult> {
    try {
      return await this.stt.transcribe(this.transcriptionsStream);
    } catch (e) {
      logger.warn("transcription error", e);
      return {} as unknown as SpeechResult;
    }
  }

  startSpeechGather(
    callback: (stream: { speech: string; responseTime: number }) => void
  ): void {
    const out = this.stt.streamTranscribe(this.transcriptionsStream);

    out.on("data", callback);

    out.on("error", async (error) => {
      logger.error("speech recognition error", { error });
      await this.ari.channels.hangup({ channelId: this.sessionRef });
    });
  }

  async startDtmfGather(
    callback: (event: { digit: string }) => void
  ): Promise<void> {
    const channel = await this.ari.channels.get({ channelId: this.sessionRef });

    channel.on(AriEvent.CHANNEL_DTMF_RECEIVED, (event) => {
      const { digit } = event;
      callback({ digit });
    });
  }

  // Returns a promise that resolves when DTMF collection is complete
  async waitForDtmf(params: {
    finishOnKey: string;
    maxDigits: number;
    timeout: number;
    onDigitReceived: () => void;
  }): Promise<{ digits: string }> {
    const { onDigitReceived, finishOnKey, maxDigits, timeout } = params;

    let result = "";
    let timeoutId = null;

    const channel = await this.ari.channels.get({ channelId: this.sessionRef });

    return new Promise((resolve) => {
      const resetTimer = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          channel.removeListener(AriEvent.CHANNEL_DTMF_RECEIVED, dtmfListener);
          resolve({ digits: result });
        }, timeout);
      };

      const dtmfListener = (event) => {
        const { digit } = event;

        // Stops the global timeout
        onDigitReceived();
        resetTimer();

        if (digit !== finishOnKey) {
          result += digit;
        }

        if (result.length >= maxDigits || digit === finishOnKey) {
          clearTimeout(timeoutId);
          channel.removeListener(AriEvent.CHANNEL_DTMF_RECEIVED, dtmfListener);
          resolve({ digits: result });
        }
      };

      channel.on(AriEvent.CHANNEL_DTMF_RECEIVED, dtmfListener);
      resetTimer(); // Start the initial timeout
    });
  }

  // Placeholder for future implementation
  stopStreamGather(): void {
    throw new Error("Method 'stopStreamGather' not implemented.");
  }
}

export { SpeechHandler };
