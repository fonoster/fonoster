/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { StreamSpeechResult } from "@fonoster/common";
import { Stream } from "stream";

export default class StreamSpeechImpl implements StreamSpeechResult {
  stream: Stream;
  constructor() {
    this.stream = new Stream();
  }

  close() {
    this.stream.removeAllListeners();
  }

  on(event: string, callback: Function) {
    if (event === "transcript") {
      this.stream.on("data", (data) => {
        callback(data);
      });
    }

    if (event === "error") {
      this.stream.on("error", (error: Error) => {
        callback(error);
      });
    }
  }

  emit(data: any) {
    this.stream.emit("data", data);
  }
}
