/* eslint-disable new-cap */
/*
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
import {
  GrpcError,
  STASIS_APP_NAME,
  SayOptions,
  StreamEvent,
  VoiceClientConfig,
  VoiceIn,
  VoiceSessionStreamClient
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { AudioSocket } from "@fonoster/streams";
import * as grpc from "@grpc/grpc-js";
import { Bridge, Client } from "ari-client";
import { pickPort } from "pick-port";
import { SpeechResult } from "./stt/types";
import { transcribeOnConnection } from "./transcribeOnConnection";
import {
  AriEvent,
  GRPCClient,
  SpeechToText,
  TextToSpeech,
  VoiceClient
} from "./types";
import { createExternalMediaConfig } from "./utils/createExternalMediaConfig";
import { VoiceServiceClientConstructor } from "./utils/VoiceServiceClientConstructor";
import {
  AUTHZ_SERVICE_ENABLED,
  AUTHZ_SERVICE_HOST,
  AUTHZ_SERVICE_PORT
} from "../envs";
import { AuthzClient } from "@fonoster/authz";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class VoiceClientImpl implements VoiceClient {
  config: VoiceClientConfig;
  verbsStream: Stream;
  transcriptionsStream: Stream;
  voice: VoiceSessionStreamClient;
  tts: TextToSpeech;
  stt: SpeechToText;
  grpcClient: GRPCClient;
  audioSocket: AudioSocket;
  asStream: Stream;
  ari: Client;
  bridge: Bridge;
  filesServer;

  constructor(
    params: {
      ari: Client;
      config: VoiceClientConfig;
      tts: TextToSpeech;
      stt: SpeechToText;
    },
    filesServer
  ) {
    const { config, tts, stt, ari } = params;
    this.config = config;
    this.verbsStream = new Stream();
    this.transcriptionsStream = new Stream();
    this.tts = tts;
    this.stt = stt;
    this.ari = ari;
    this.filesServer = filesServer;
  }

  async connect() {
    if (AUTHZ_SERVICE_ENABLED) {
      const { sessionRef: channelId } = this.config;
      const { ari } = this;

      try {
        const authz = new AuthzClient(
          `${AUTHZ_SERVICE_HOST}:${AUTHZ_SERVICE_PORT}`
        );
        const authorized = await authz.checkSessionAuthorized({
          accessKeyId: this.config.accessKeyId
        });

        if (!authorized) {
          logger.verbose("rejected unauthorized session", { channelId });

          await ari.channels.answer({ channelId });
          await ari.channels.play({ channelId, media: "sound:unavailable" });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await ari.channels.hangup({ channelId });
          return;
        }
      } catch (e) {
        logger.error("authz service error", e);

        // TODO: Play a different sound
        await ari.channels.answer({ channelId });
        await ari.channels.play({ channelId, media: "sound:unavailable" });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await ari.channels.hangup({ channelId });
        return;
      }
    }

    this.grpcClient = new VoiceServiceClientConstructor(
      this.config.endpoint,
      grpc.credentials.createInsecure()
    ) as unknown as GRPCClient;

    const metadata = new grpc.Metadata();
    metadata.add("accessKeyId", this.config.accessKeyId);
    metadata.add("token", this.config.sessionToken);

    this.voice = this.grpcClient.createSession(metadata);

    this.voice.on(StreamEvent.DATA, (data: VoiceIn) => {
      this.verbsStream.emit(data.content, data);
    });

    this.voice.write({ request: this.config });

    this.voice.on(StreamEvent.ERROR, (error: GrpcError) => {
      if (error.code === grpc.status.UNAVAILABLE) {
        // FIXME: This error should be sent back to the user
        logger.error(`voice server not available at "${this.config.endpoint}"`);
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

    this.audioSocket.onConnection(
      transcribeOnConnection(this.transcriptionsStream)
    );

    this.audioSocket.listen(port, () => {
      logger.verbose("starting audio socket for voice client", {
        port,
        appRef: this.config.appRef
      });
    });
  }

  on(type: string, callback: (data: VoiceIn) => void) {
    this.verbsStream.on(type.toString(), (data: VoiceIn) => {
      callback(data[type]);
    });
  }

  sendResponse(response: VoiceIn): void {
    this.voice.write(response);
  }

  getTranscriptionsStream() {
    return this.transcriptionsStream;
  }

  async setupExternalMedia(port: number) {
    // Snoop from the main channel
    const snoopChannel = await this.ari.channels.snoopChannel({
      app: STASIS_APP_NAME,
      channelId: this.config.sessionRef,
      snoopId: `snoop-${this.config.sessionRef}`,
      spy: "in"
    });

    const bridge = this.ari.Bridge();

    await bridge.create({ type: "mixing" });

    this.bridge = bridge;

    const channel = this.ari.Channel();

    channel.externalMedia(createExternalMediaConfig(port));

    channel.once(AriEvent.STASIS_START, async (_, channel) => {
      bridge.addChannel({ channel: [snoopChannel.id, channel.id] });
    });

    channel.once("ChannelLeftBridge", async () => {
      try {
        await bridge.destroy();
      } catch (e) {
        // We can only try
      }
    });
  }

  async synthesize(text: string, options: SayOptions): Promise<string> {
    const { ref, stream } = await this.tts.synthesize(text, options);
    this.filesServer.addStream(ref, stream);
    return ref;
  }

  async transcribe(): Promise<SpeechResult> {
    try {
      return await this.stt.transcribe(this.transcriptionsStream);
    } catch (e) {
      logger.warn("transcription error", e);
      return {} as unknown as SpeechResult;
    }
  }

  async startSpeechGather(
    callback: (stream: { speech?: string; digits?: string; responseTime: number; }) => void
  ) {
    try {
      const out = this.stt.streamTranscribe(this.transcriptionsStream);
      out.on("data", callback);
    } catch (e) {
      logger.error(e);
    }
  }

  async startDtmfGather(
    sessionRef: string,
    callback: (event: { digit: string }) => void
  ) {
    const channel = await this.ari.channels.get({ channelId: sessionRef });

    channel.on(AriEvent.CHANNEL_DTMF_RECEIVED, (event) => {
      const { digit } = event;
      callback({ digit });
    });
  }

  // Stops both speech and dtmf gather
  async stopStreamGather() {
    throw new Error("Method 'stopStreamGather' not implemented.");
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
      this.voice.end();
      this.grpcClient.close();
      this.audioSocket.close();
    } catch (e) {
      // Do nothing
    }
  }
}

export { VoiceClientImpl };
