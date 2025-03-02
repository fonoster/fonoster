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
import {
  DialRecordDirection,
  DialRequest,
  DialStatus,
  Messages
} from "@fonoster/common";
import { z } from "zod";
import { Verb } from "./Verb";

class Dial extends Verb<DialRequest> {
  getValidationSchema(): z.Schema {
    return z.object({
      destination: z.string(),
      timeout: z
        .number()
        .int({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .positive({ message: Messages.POSITIVE_INTEGER_MESSAGE })
        .optional(),
      recordDirection: z
        .nativeEnum(DialRecordDirection, {
          message: "Invalid record direction."
        })
        .optional()
    });
  }
}

class DialStatusStream {
  stream: Stream;
  constructor() {
    this.stream = new Stream();
  }

  close() {
    this.stream.removeAllListeners();
  }

  on(callback: (data: DialStatus) => void) {
    this.stream.on("status", (data) => {
      callback(data);
    });
  }

  emit(status: DialStatus) {
    this.stream.emit("status", status);
  }
}

export { Dial, DialStatusStream };
