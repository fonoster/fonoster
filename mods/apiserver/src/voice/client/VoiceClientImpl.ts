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
import {
  AudioFilterConfig,
  AudioFilterSession,
  ChainStats,
  createAudioFilterSession
} from "../filters";
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
  // Owns the call's filter chain: building, replacing and retiring it
  private readonly audioFilters: AudioFilterSession =
    createAudioFilterSession();

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
      config: this.config,
      getFilterChain: () => this.audioFilters.current()
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
      mediaSessionRef: this.config.mediaSessionRef
    });

    // Set up the GRPC client LAST. Opening the session immediately writes the request
    // that starts the voice application, so nothing it may depend on can still be
    // pending when that happens — the Say handler needs the speech handler built just
    // above, and the caller attaches the verb listeners before calling connect (see
    // VoiceDispatcher.handleStasisStart). Doing this first let a fast application's
    // opening verbs arrive before the client could serve them.
    await this.grpcHandler.setupGrpcClient();

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
    mediaSessionRef: string,
    callback: (event: { digit: string }) => void
  ): Promise<void> {
    return this.speechHandler.startDtmfGather(callback);
  }

  async waitForDtmf(params: {
    mediaSessionRef: string;
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

  /**
   * Replaces the session's audio filters. Rejects when they cannot be
   * applied, leaving the call on whatever it had before.
   */
  async setAudioFilters(filters: AudioFilterConfig[]): Promise<void> {
    await this.audioFilters.set(filters);

    logger.verbose("audio filters set", {
      mediaSessionRef: this.config.mediaSessionRef,
      filters: filters.map((filter) => filter.name)
    });
  }

  close(): void {
    this.logFilterStats(this.audioFilters.close());
    this.grpcHandler.close();
    this.audioSocketHandler.close();
  }

  // One line per filtered call, so filter cost and any filter that gave up are
  // visible in production without turning on verbose logging
  private logFilterStats(stats: ChainStats | null): void {
    if (!stats) {
      return;
    }

    logger.info("audio filter stats for session", {
      mediaSessionRef: this.config.mediaSessionRef,
      frames: stats.total.frames,
      p50Ms: stats.total.p50Ms,
      p95Ms: stats.total.p95Ms,
      delayMs: stats.total.delayMs,
      disabled: stats.filters
        .filter((filter) => filter.disabled)
        .map((filter) => `${filter.name}: ${filter.error}`)
    });
  }

  get tts(): TextToSpeech {
    return this._tts;
  }

  get stt(): SpeechToText {
    return this._stt;
  }
}

export { VoiceClientImpl };
