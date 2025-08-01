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
import { Readable, Stream } from "stream";
import {
  SayOptions,
  StreamContent,
  VoiceClientConfig,
  VoiceIn,
  VoiceSessionStreamClient
} from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { SpeechResult, StreamSpeech } from "../stt/types";

type VoiceClient = {
  config: VoiceClientConfig;
  sendResponse: (command: VoiceIn) => void;
  on: (type: StreamContent, callback: (data: VoiceIn) => void) => void;
  connect: () => void;
  close: () => void;
  synthesize: (text: string, options: SayOptions) => Promise<string>;
  transcribe: () => Promise<SpeechResult>;
  startSpeechGather: (
    callback: (stream: { speech: string; responseTime: number }) => void
  ) => void;
  startDtmfGather: (
    sessionRef: string,
    callback: (event: { digit: string }) => void
  ) => void;
  // Stops both speech and dtmf gather
  stopStreamGather: () => void;
  waitForDtmf: (params: {
    sessionRef: string;
    finishOnKey: string;
    maxDigits: number;
    timeout: number;
    onDigitReceived: () => void;
  }) => Promise<{ digits: string }>;
  getTranscriptionsStream: () => Stream;
  stopSynthesis: () => Promise<void>;
};

type TextToSpeech = {
  synthesize: (
    text: string,
    options: Record<string, unknown>
  ) => { ref: string; stream: Readable };
};

type SpeechToText = {
  transcribe: (stream: Stream) => Promise<SpeechResult>;
  streamTranscribe(stream: Stream): StreamSpeech;
};

type GRPCClient = {
  createSession: (metadata: grpc.Metadata) => VoiceSessionStreamClient;
  close: () => void;
};

export { GRPCClient, SpeechToText, TextToSpeech, VoiceClient };
