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
import { VerbRequest, VerbResponse } from "./Verb";

enum StreamDirection {
  IN = "IN",
  OUT = "OUT",
  BOTH = "BOTH"
}

enum StreamAudioFormat {
  WAV = "WAV"
}

enum StreamMessageType {
  AUDIO_IN = "AUDIO_IN",
  AUDIO_OUT = "AUDIO_OUT",
  ERROR = "ERROR"
}

type StreamOptions = {
  direction?: StreamDirection;
  format?: StreamAudioFormat;
};

type StartStreamRequest = VerbRequest & StreamOptions;

type StartStreamResponse = VerbResponse & {
  streamRef: string;
};

type StopStreamRequest = VerbRequest & {
  streamRef: string;
};

type StreamPayload = {
  mediaSessionRef: string;
  streamRef: string;
  format: StreamAudioFormat;
  type: StreamMessageType;
  data?: Uint8Array;
  code?: string;
  message?: string;
};

export {
  StartStreamRequest,
  StartStreamResponse,
  StopStreamRequest,
  StreamAudioFormat,
  StreamDirection,
  StreamMessageType,
  StreamOptions,
  StreamPayload
};
