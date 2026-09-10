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
import { CallDirection } from "@fonoster/types";
import { Bridge, Client } from "ari-client";
import { pickPort } from "pick-port";
import {
  AMD_ENABLED,
  AMD_MIN_CONFIDENCE,
  AMD_MODEL_PATH,
  AMD_PROBE_MS,
  AMD_TIMEOUT_MS
} from "../../envs";
import { amdResultCache } from "../../events/amdResultCache";
import { runAmdProbe } from "../amd/runAmdProbe";
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

    // Run Answering Machine Detection on the leading audio before the session is
    // dispatched, so the voice application already has the verdict on its
    // request. PSTN-terminated outbound calls only: the far end has answered by
    // this point (200 OK preceded the dialplan), whereas inbound channels are
    // not yet answered here and on-net (INTRA_NETWORK) legs do not reach a
    // carrier voicemail/IVR. Always fail-open: runAmdProbe never throws and a
    // failure/timeout yields an UNKNOWN verdict.
    if (AMD_ENABLED && this.config.callDirection === CallDirection.TO_PSTN) {
      const amd = await runAmdProbe({
        audio: this.transcriptionsStream,
        probeMs: AMD_PROBE_MS,
        timeoutMs: AMD_TIMEOUT_MS,
        minConfidence: AMD_MIN_CONFIDENCE,
        modelDir: AMD_MODEL_PATH || undefined
      });

      this.config.amd = amd;

      // Persist the verdict onto the call's CDR for later analysis. Keyed by
      // callRef, which equals the CDR `ref` tag for outbound calls.
      amdResultCache.set(this.config.callRef, {
        status: amd.status,
        confidence: amd.confidence,
        detector: amd.detector,
        latencyMs: amd.latencyMs
      });

      logger.verbose("amd verdict attached to session", {
        callRef: this.config.callRef,
        status: amd.status,
        confidence: amd.confidence,
        latencyMs: amd.latencyMs
      });
    }

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
