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
import { Stream as StreamObj } from "stream";
import { z } from "zod";
import { Verb, VerbRequest, VerbResponse } from "./Verb";

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
  ERROR = "ERROR",
  VOICE_ACTIVITY_START = "VOICE_ACTIVITY_START",
  VOICE_ACTIVITY_STOP = "VOICE_ACTIVITY_STOP"
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

class StartStream extends Verb<StartStreamRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      direction: z.nativeEnum(StreamDirection),
      format: z.nativeEnum(StreamAudioFormat),
      enableVad: z.boolean()
    });
  }
}

class StopStream extends Verb<StopStreamRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      streamRef: z.string()
    });
  }
}

class Stream {
  stream: StreamObj;
  constructor() {
    this.stream = new StreamObj();
  }

  close() {
    this.stream.removeAllListeners();
  }

  // Public API
  onPayload(callback: (payload: StreamPayload) => void) {
    this.stream.on("payloadOut", (payload: StreamPayload) => {
      callback(payload);
    });
  }

  write(payload: StreamPayload) {
    this.stream.emit("payloadIn", payload);
  }

  // TODO: We should hide this method from the public API
  // Private API
  onPayloadIn(callback: (payload: StreamPayload) => void) {
    this.stream.on("payloadIn", (payload) => {
      callback(payload);
    });
  }

  // Private API
  emit(event: "payloadIn" | "payloadOut", payload: StreamPayload) {
    this.stream.emit(event, payload);
  }

  // Private API
  cleanup(callback: () => void) {
    this.stream.on("close", callback);
  }
}

export {
  StartStream,
  StartStreamRequest,
  StartStreamResponse,
  StopStreamRequest,
  StreamOptions,
  StopStream,
  StreamMessageType,
  StreamDirection,
  StreamAudioFormat,
  StreamPayload,
  Stream
};
