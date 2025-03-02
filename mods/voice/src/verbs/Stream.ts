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
import { Stream as StreamObj } from "stream";
import {
  Messages,
  StartStreamRequest,
  StopStreamRequest,
  StreamAudioFormat,
  StreamDirection,
  StreamPayload
} from "@fonoster/common";
import { z } from "zod";
import { Verb } from "./Verb";

class StartStream extends Verb<StartStreamRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      direction: z
        .nativeEnum(StreamDirection, { message: "Invalid stream direction" })
        .optional(),
      format: z
        .nativeEnum(StreamAudioFormat, {
          message: "Invalid stream audio direction"
        })
        .optional()
    });
  }
}

class StopStream extends Verb<StopStreamRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      streamRef: z.string().uuid({ message: Messages.VALID_UUID })
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

export { StartStream, StopStream, Stream };
