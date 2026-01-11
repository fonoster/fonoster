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
import { Messages, VoiceLanguage } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as z from "zod";
import { SpeechToText } from "../types";
import { AbstractSpeechToText } from "./AbstractSpeechToText";
import {
  DeepgramModel,
  DeepgramSttConfig,
  SpeechResult,
  StreamSpeech
} from "./types";
const {
  DeepgramClient,
  LiveTranscriptionEvents,
  createClient
  // eslint-disable-next-line @typescript-eslint/no-var-requires
} = require("@deepgram/sdk"); // Why Deepgram :(

const ENGINE_NAME = "stt.deepgram";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Deepgram
  extends AbstractSpeechToText<typeof ENGINE_NAME>
  implements SpeechToText
{
  client: typeof DeepgramClient;
  engineConfig: DeepgramSttConfig;
  readonly engineName = ENGINE_NAME;

  constructor(config: DeepgramSttConfig) {
    super(config);
    this.client = createClient(config.credentials.apiKey);
    this.engineConfig = config;
  }

  streamTranscribe(stream: Stream): StreamSpeech {
    const connection = this.client.listen.live(
      buildTranscribeConfig(this.engineConfig.config)
    );

    const out = new Stream();

    // Track last transcript for UtteranceEnd fallback
    // According to Deepgram docs: "If you receive an UtteranceEnd event without a
    // preceding speech_final: true, it's advisable to process the last-received
    // transcript as a complete utterance."
    // UtteranceEnd fires after finalized words, so we store the last finalized transcript
    // but also keep any transcript as a fallback
    let lastFinalizedTranscript: string | null = null;
    let lastFinalizedTranscriptTime: number = 0;
    let lastAnyTranscript: string | null = null;
    let lastAnyTranscriptTime: number = 0;

    // Add error handler immediately to catch any connection errors
    connection.on(LiveTranscriptionEvents.Error, (err) => {
      logger.error("error on Deepgram connection", { err });
      // Emit error properly for handling upstream
      out.emit("error", new Error("Speech recognition service error"));

      try {
        connection.destroy();
      } catch (destroyErr) {
        logger.error("error destroying connection", { destroyErr });
      }
    });

    connection.on(LiveTranscriptionEvents.Open, () => {
      stream.on("data", (chunk) => {
        try {
          connection.send(chunk);
        } catch (err) {
          logger.error("error sending chunk to Deepgram", { err });
        }
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        const hasTranscript = !!transcript;
        const isFinal = data.is_final === true;
        const speechFinal = data.speech_final === true;

        // Store any transcript for UtteranceEnd fallback
        if (hasTranscript) {
          lastAnyTranscript = transcript;
          lastAnyTranscriptTime = Date.now();

          // Store finalized transcripts separately (preferred for UtteranceEnd)
          if (isFinal || speechFinal) {
            lastFinalizedTranscript = transcript;
            lastFinalizedTranscriptTime = Date.now();
          }
        }

        // Process transcript if it has content and is final
        // Check both speech_final (primary) and is_final (backup)
        if (!hasTranscript || (!speechFinal && !isFinal)) {
          return;
        }

        const words = data.channel.alternatives[0].words || [];

        const responseTime =
          words.length > 0
            ? (words.reduce(
                (acc: number, word: any) => acc + (word.end - word.start),
                0
              ) *
                1000) /
              words.length
            : 0;

        logger.verbose("transcribe result", {
          speech: transcript,
          responseTime,
          isFinal,
          speechFinal
        });

        out.emit("data", {
          speech: transcript,
          responseTime
        });

        // Clear transcripts after processing (they've been emitted)
        lastFinalizedTranscript = null;
        lastAnyTranscript = null;
      });

      // CRITICAL: Handle UtteranceEnd events (fallback when speech_final never becomes true)
      // This is Deepgram's recommended fallback mechanism for noisy environments
      // UtteranceEnd requires: interim_results=true and utterance_end_ms parameter
      // UtteranceEnd fires after finalized words, so prefer lastFinalizedTranscript
      connection.on(LiveTranscriptionEvents.UtteranceEnd, (data) => {
        // Prefer finalized transcript, fall back to any transcript
        const transcriptToUse = lastFinalizedTranscript || lastAnyTranscript;
        const transcriptTime = lastFinalizedTranscript
          ? lastFinalizedTranscriptTime
          : lastAnyTranscriptTime;

        if (transcriptToUse) {
          // Use last_word_end from UtteranceEnd event if available for more accurate timing
          // Otherwise fall back to time since last transcript
          const lastWordEnd = data?.last_word_end;
          const responseTime = lastWordEnd
            ? lastWordEnd * 1000 // Convert seconds to milliseconds
            : transcriptTime
              ? Date.now() - transcriptTime
              : 0;

          logger.info("Deepgram UtteranceEnd - processing last transcript", {
            speech: transcriptToUse,
            responseTime,
            lastWordEnd: lastWordEnd,
            wasFinalized: !!lastFinalizedTranscript
          });

          out.emit("data", {
            speech: transcriptToUse,
            responseTime
          });

          // Clear transcripts after processing
          lastFinalizedTranscript = null;
          lastAnyTranscript = null;
        } else {
          logger.warn(
            "Deepgram UtteranceEnd received but no last transcript available"
          );
        }
      });
    });

    // Handle stream errors and cleanup
    stream.on("error", (err) => {
      logger.warn("error on input stream", { err });
      // Instead of emitting an error, just end the stream with a message
      out.emit("data", {
        speech: "Error with audio input stream",
        responseTime: 0
      });
      out.emit("end");

      try {
        connection.destroy();
      } catch (destroyErr) {
        logger.warn("error destroying connection", { destroyErr });
      }
    });

    stream.on("end", () => {
      try {
        connection.destroy();
      } catch (err) {
        logger.error("error destroying connection on stream end", { err });
      }
    });

    return out;
  }

  async transcribe(stream: Stream): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();

      const connection = this.client.listen.live(
        buildTranscribeConfig(this.engineConfig.config)
      );

      stream.on("data", (chunk) => {
        connection.send(chunk);
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          if (data.channel.alternatives[0].transcript && data.speech_final) {
            const result: SpeechResult = {
              speech: data.channel.alternatives[0].transcript,
              isFinal: true,
              responseTime: performance.now() - startTime
            };

            logger.verbose("transcribe result", {
              speech: result.speech,
              responseTime: result.responseTime
            });

            resolve(result);
            connection.destroy();
          }
        });

        connection.on(LiveTranscriptionEvents.Error, (err) => {
          logger.warn("error on Deepgram connection", { err });
          reject(err);
        });
      });

      stream.on("end", () => {
        try {
          connection.destroy();
        } catch (destroyErr) {
          logger.error("error destroying connection", { destroyErr });
        }
      });

      stream.on("error", (err) => {
        try {
          connection.destroy();
        } catch (destroyErr) {
          logger.error("error destroying connection", { destroyErr });
        }
        reject(err);
      });
    });
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      smartFormat: z.boolean().optional(),
      noDelay: z.boolean().optional(),
      languageCode: z
        .nativeEnum(VoiceLanguage, {
          message: Messages.VALID_LANGUAGE_CODE
        })
        .optional(),
      model: z
        .nativeEnum(DeepgramModel, { message: "Invalid Deepgram model" })
        .optional(),
      interimResults: z.boolean().optional(),
      utteranceEndMs: z.number().int().min(1000).max(5000).optional()
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      apiKey: z.string()
    });
  }
}

function buildTranscribeConfig(config: {
  model: DeepgramModel;
  languageCode: VoiceLanguage;
  smartFormat?: boolean;
  noDelay?: boolean;
  interimResults?: boolean;
  utteranceEndMs?: number;
}) {
  // UtteranceEnd requires interim_results to be enabled
  // Default to true to enable UtteranceEnd fallback mechanism
  const interimResults = config.interimResults !== false;

  // Default utterance_end_ms to 1000ms (minimum required value)
  // This enables UtteranceEnd events as a fallback when speech_final never becomes true
  const utteranceEndMs = config.utteranceEndMs || 1000;

  return {
    ...config,
    model: config.model || DeepgramModel.NOVA_2_PHONECALL,
    language: config.languageCode || VoiceLanguage.EN_US,
    encoding: "linear16",
    sample_rate: 16000,
    channels: 1,
    smart_format: config.smartFormat !== false,
    // This needs to be set to true to avoid delays while using smart_format
    no_delay: config.noDelay !== false,
    // REQUIRED for UtteranceEnd: interim_results must be true
    interim_results: interimResults,
    // REQUIRED for UtteranceEnd: utterance_end_ms parameter
    utterance_end_ms: utteranceEndMs
  };
}

export { Deepgram, ENGINE_NAME };
