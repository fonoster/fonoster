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
import { VoiceLanguage } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as z from "zod";
import { AbstractSpeechToText } from "./AbstractSpeechToText";
import {
  DeepgramModel,
  DeepgramSttConfig,
  SpeechResult,
  StreamSpeech
} from "./types";
import { SpeechToText } from "../types";
const {
  DeepgramClient,
  LiveTranscriptionEvents,
  createClient
} = require("@deepgram/sdk");
const fetch = require("cross-fetch");

const ENGINE_NAME = "stt.deepgram";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class Deepgram
  extends AbstractSpeechToText<typeof ENGINE_NAME>
  implements SpeechToText
{
  client: typeof DeepgramClient;
  config: DeepgramSttConfig;
  readonly engineName = ENGINE_NAME;

  constructor(config: DeepgramSttConfig) {
    super(config);
    this.client = createClient(config.credentials.apiKey);
  }

  streamTranscribe(stream: Stream): StreamSpeech {
    const connection = this.client.listen.live({
      model: DeepgramModel.NOVA_2,
      encoding: "linear16",
      sample_rate: 16000,
      language: "en-US",
      smart_format: true
    });

    const out = new Stream();

    connection.on(LiveTranscriptionEvents.Open, () => {
      stream.on("data", (chunk) => {
        connection.send(chunk);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        if (!data.channel.alternatives[0].transcript || !data.speech_final) {
          return;
        }

        out.emit("data", {
          speech: data.channel.alternatives[0].transcript
        });
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        logger.warn("error on Deepgram connection", { err });
        connection.destroy();
      });
    });

    return out;
  }

  async transcribe(stream: Stream): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      const connection = this.client.listen.live({
        model: DeepgramModel.NOVA_2,
        encoding: "linear16",
        sample_rate: 16000,
        language: "en-US",
        smart_format: true,
        interim_results: false
      });

      stream.on("data", (chunk) => {
        connection.send(chunk);
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          if (data.channel.alternatives[0].transcript && data.speech_final) {
            const result: SpeechResult = {
              speech: data.channel.alternatives[0].transcript,
              isFinal: true
            };

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
        connection.destroy();
      });

      stream.on("error", (err) => {
        connection.destroy();
        reject(err);
      });
    });
  }

  static getConfigValidationSchema(): z.Schema {
    return z.object({
      language: z.nativeEnum(VoiceLanguage),
      model: z.nativeEnum(DeepgramModel)
    });
  }

  static getCredentialsValidationSchema(): z.Schema {
    return z.object({
      apiKey: z.string()
    });
  }
}

export { Deepgram, ENGINE_NAME };
