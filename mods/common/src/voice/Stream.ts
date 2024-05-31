import { VerbRequest, VerbResponse } from "./Verb";

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
enum StreamDirection {
  IN = "in",
  OUT = "out",
  BOTH = "both"
}

enum StreamAudioFormat {
  WAV = "wav"
}

enum StreamMessageType {
  AUDIO_IN = "audioIn",
  AUDIO_OUT = "audioOut",
  ERROR = "error",
  VOICE_ACTIVITY_START = "voiceActivityStart",
  VOICE_ACTIVITY_STOP = "voiceActivityStop"
}

type StreamOptions = {
  direction: StreamDirection;
  format: StreamAudioFormat;
  enableVad: boolean;
};

type StartStreamRequest = VerbRequest & StreamOptions;

type StartStreamResponse = VerbResponse & {
  streamRef: string;
};

type StopStreamRequest = VerbRequest & {
  streamRef: string;
};

type StreamPayload = {
  sessionRef: string;
  streamRef: string;
  direction: StreamDirection;
  format: StreamAudioFormat;
  type: StreamMessageType;
  enableVad?: boolean;
  data?: Buffer;
  code?: string;
  message?: string;
};

export {
  StreamDirection,
  StreamAudioFormat,
  StreamMessageType,
  StreamOptions,
  StartStreamRequest,
  StartStreamResponse,
  StopStreamRequest,
  StreamPayload
};
