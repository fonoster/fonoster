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
  StartStreamGatherRequest,
  StreamGatherPayload,
  StreamGatherSource,
  VerbRequest
} from "@fonoster/common";
import { z } from "zod";
import { Verb } from "./Verb";

class StartStreamGather extends Verb<StartStreamGatherRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      source: z.optional(
        z.nativeEnum(StreamGatherSource, {
          message: "Invalid stream gather source."
        })
      )
    });
  }
}

class StopStreamGather extends Verb<VerbRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      sessionRef: z.string().uuid({ message: Messages.VALID_UUID })
    });
  }
}

class StreamGatherStream {
  stream: StreamObj;
  constructor() {
    this.stream = new StreamObj();
  }

  close() {
    this.stream.removeAllListeners();
  }

  // Private API
  onPayload(callback: (payload: StreamGatherPayload) => void) {
    this.stream.on("data", (payload) => {
      callback(payload);
    });
  }

  // Private API
  emit(event: "data", payload: StreamGatherPayload) {
    this.stream.emit(event, payload);
  }

  // Private API
  cleanup(callback: () => void) {
    this.stream.on("close", callback);
  }
}

export { StartStreamGather, StopStreamGather, StreamGatherStream };
