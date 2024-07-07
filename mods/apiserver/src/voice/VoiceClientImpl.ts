/* eslint-disable new-cap */
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
import {
  GrpcError,
  SayOptions,
  StreamEvent,
  VoiceClientConfig,
  VoiceIn,
  VoiceSessionStreamClient
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { AudioSocket } from "@fonoster/streams";
import * as grpc from "@grpc/grpc-js";
import { Client } from "ari-client";
import { pickPort } from "pick-port";
import { createExternalMediaConfig } from "./createExternalMediaConfig";
import { SpeechResult } from "./stt/types";
import { transcribeOnConnection } from "./transcribeOnConnection";
import {
  AriEvent,
  GRPCClient,
  SpeechToText,
  TextToSpeech,
  VoiceClient
} from "./types";
import { VoiceServiceClient } from "./VoiceServiceClientConst";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class VoiceClientImpl implements VoiceClient {
  config: VoiceClientConfig;
  stream: Stream;
  voice: VoiceSessionStreamClient;
  tts: TextToSpeech;
  stt: SpeechToText;
  grpcClient: GRPCClient;
  audioSocket: AudioSocket;
  asStream: Stream;
  ari: Client;

  constructor(params: {
    ari: Client;
    config: VoiceClientConfig;
    tts: TextToSpeech;
    stt: SpeechToText;
  }) {
    const { config, tts, stt, ari } = params;
    this.config = config;
    this.stream = new Stream();
    this.tts = tts;
    this.stt = stt;
    this.ari = ari;
  }

  async connect() {
    this.grpcClient = new VoiceServiceClient(
      this.config.appEndpoint,
      grpc.credentials.createInsecure()
    ) as unknown as GRPCClient;

    const metadata = new grpc.Metadata();
    metadata.add("accessKeyId", this.config.accessKeyId);
    metadata.add("token", this.config.sessionToken);

    this.voice = this.grpcClient.createSession(metadata);

    this.voice.on(StreamEvent.DATA, (data: VoiceIn) => {
      this.stream.emit(data.content, data);
    });

    this.voice.write({ request: this.config });

    this.voice.on(StreamEvent.ERROR, (error: GrpcError) => {
      if (error.code === grpc.status.UNAVAILABLE) {
        // FIXME: This error should be sent back to the user
        logger.error(
          `voice server not available at "${this.config.appEndpoint}"`
        );
        return;
      }
      logger.error(error.message);
    });

    const externalMediaPort = await pickPort({ type: "tcp" });

    this.setupAudioSocket(externalMediaPort);
    await this.setupExternalMedia(externalMediaPort);
  }

  setupAudioSocket(port: number) {
    this.audioSocket = new AudioSocket();

    this.audioSocket.onConnection(transcribeOnConnection(this.stream));

    this.audioSocket.listen(port, () => {
      logger.verbose("starting audio socket for voice client", {
        port,
        appRef: this.config.appRef
      });
    });
  }

  async setupExternalMedia(port: number) {
    const bridge = this.ari.Bridge();
    await bridge.create({ type: "mixing" });

    const channel = this.ari.Channel();

    channel.externalMedia(createExternalMediaConfig(port));

    channel.once(AriEvent.STASIS_START, async (_, channel) => {
      await bridge.addChannel({
        channel: [this.config.sessionRef, channel.id]
      });

      await channel.answer();
    });
  }

  on(type: string, callback: (data: VoiceIn) => void) {
    this.stream.on(type.toString(), (data: VoiceIn) => {
      callback(data[type]);
    });
  }

  sendResponse(response: VoiceIn): void {
    this.voice.write(response);
  }

  async synthesize(text: string, options: SayOptions): Promise<string> {
    return await this.tts.synthesize(text, options);
  }

  async transcribe(): Promise<SpeechResult> {
    try {
      return await this.stt.transcribe(this.stream);
    } catch (e) {
      logger.warn("transcription error", e);
      return {} as unknown as SpeechResult;
    }
  }

  async waitForDtmf(params: {
    sessionRef: string;
    finishOnKey: string;
    maxDigits: number;
    timeout: number;
    onDigitReceived: () => void;
  }): Promise<{ digits: string }> {
    const { onDigitReceived, sessionRef, finishOnKey, maxDigits, timeout } =
      params;

    let result = "";
    let timeoutId = null;

    const channel = await this.ari.channels.get({ channelId: sessionRef });

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

  close() {
    try {
      this.grpcClient.close();
      this.audioSocket.close();
    } catch (e) {
      // Do nothing
    }
  }
}

export { VoiceClientImpl };
