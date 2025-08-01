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
import { SayOptions, VoiceClientConfig, VoiceIn } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Bridge, Client } from "ari-client";
import { pickPort } from "pick-port";
import { SpeechResult } from "../stt/types";
import { SpeechToText, TextToSpeech, VoiceClient } from "../types";
import { AudioSocketHandler } from "./AudioSocketHandler";
import { AuthorizationHandler } from "./AuthorizationHandler";
import { ExternalMediaHandler } from "./ExternalMediaHandler";
import { GrpcClientHandler } from "./GrpcClientHandler";
import { SpeechHandler } from "./SpeechHandler";

const logger = getLogger({ service: "apiserver", filePath: __filename });

class VoiceClientImpl implements VoiceClient {
  config: VoiceClientConfig;
  verbsStream: Stream;
  transcriptionsStream: Stream;
  ari: Client;
  bridge: Bridge;

  // Component handlers
  private authHandler: AuthorizationHandler;
  private audioSocketHandler: AudioSocketHandler;
  private externalMediaHandler: ExternalMediaHandler;
  private grpcHandler: GrpcClientHandler;
  private speechHandler: SpeechHandler;

  // Store the speech services for initialization
  private _tts: TextToSpeech;
  private _stt: SpeechToText;

  constructor(params: {
    ari: Client;
    config: VoiceClientConfig;
    tts: TextToSpeech;
    stt: SpeechToText;
  }) {
    const { config, tts, stt, ari } = params;

    this.config = config;
    this.ari = ari;
    this._tts = tts;
    this._stt = stt;
    this.verbsStream = new Stream();
    this.transcriptionsStream = new Stream();

    // Initialize component handlers
    this.authHandler = new AuthorizationHandler({
      config: this.config,
      ari: this.ari
    });

    this.audioSocketHandler = new AudioSocketHandler({
      transcriptionsStream: this.transcriptionsStream,
      config: this.config
    });

    this.externalMediaHandler = new ExternalMediaHandler({
      ari: this.ari,
      config: this.config
    });

    this.grpcHandler = new GrpcClientHandler({
      config: this.config,
      verbsStream: this.verbsStream
    });
  }

  async connect() {
    // Check authorization
    const isAuthorized = await this.authHandler.checkAuthorization();
    if (!isAuthorized) {
      return;
    }

    // Set up GRPC client
    await this.grpcHandler.setupGrpcClient();

    // Set up audio socket and external media
    const externalMediaPort = await pickPort({ type: "tcp" });
    logger.verbose("picked external media port", { port: externalMediaPort });

    // Wait for both audio socket and external media setup to complete
    await Promise.all([
      this.audioSocketHandler.setupAudioSocket(externalMediaPort),
      this.externalMediaHandler.setupExternalMedia(externalMediaPort)
    ]);

    // Get the bridge from the external media handler
    this.bridge = this.externalMediaHandler.getBridge();

    // Initialize speech handler now that we have the audio stream
    this.speechHandler = new SpeechHandler({
      tts: this._tts,
      stt: this._stt,
      ari: this.ari,
      transcriptionsStream: this.transcriptionsStream,
      audioStream: this.audioSocketHandler.getAudioStream(),
      sessionRef: this.config.sessionRef
    });

    logger.verbose("voice client setup completed");
  }

  // Public API methods required by VoiceClient interface

  sendResponse(response: VoiceIn): void {
    this.grpcHandler.sendResponse(response);
  }

  on(type: string, callback: (data: VoiceIn) => void): void {
    this.verbsStream.on(type.toString(), (data: VoiceIn) => {
      callback(data[type]);
    });
  }

  async synthesize(text: string, options: SayOptions): Promise<string> {
    return this.speechHandler.synthesize(text, options);
  }

  async stopSynthesis(): Promise<void> {
    return this.speechHandler.stopSynthesis();
  }

  async transcribe(): Promise<SpeechResult> {
    return this.speechHandler.transcribe();
  }

  startSpeechGather(
    callback: (stream: { speech: string; responseTime: number }) => void
  ): void {
    this.speechHandler.startSpeechGather(callback);
  }

  async startDtmfGather(
    sessionRef: string,
    callback: (event: { digit: string }) => void
  ): Promise<void> {
    return this.speechHandler.startDtmfGather(callback);
  }

  async waitForDtmf(params: {
    sessionRef: string;
    finishOnKey: string;
    maxDigits: number;
    timeout: number;
    onDigitReceived: () => void;
  }): Promise<{ digits: string }> {
    const { finishOnKey, maxDigits, timeout, onDigitReceived } = params;
    return this.speechHandler.waitForDtmf({
      finishOnKey,
      maxDigits,
      timeout,
      onDigitReceived
    });
  }

  stopStreamGather(): void {
    this.speechHandler.stopStreamGather();
  }

  getTranscriptionsStream(): Stream {
    return this.transcriptionsStream;
  }

  close(): void {
    this.grpcHandler.close();
    this.audioSocketHandler.close();
  }

  get tts(): TextToSpeech {
    return this._tts;
  }

  get stt(): SpeechToText {
    return this._stt;
  }
}

export { VoiceClientImpl };
