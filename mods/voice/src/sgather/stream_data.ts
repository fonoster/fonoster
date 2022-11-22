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
import { Stream } from "stream";
import { SGatherStream } from "./types";
import PubSub from "pubsub-js";

export default class StreamData implements SGatherStream {
  stream: Stream;
  dtmfSubscribeToken: string;
  speechSubscribeToken: string;
  constructor() {
    this.stream = new Stream();
  }

  close() {
    if (this.dtmfSubscribeToken) {
      PubSub.unsubscribe(this.dtmfSubscribeToken);
    }
    if (this.speechSubscribeToken) {
      PubSub.unsubscribe(this.speechSubscribeToken);
    }

    this.stream.removeAllListeners();
  }

  on(event: string, callback: Function) {
    if (event === "transcript") {
      this.stream.on("transcript", (data) => {
        callback(data);
      });
    }

    if (event === "dtmf") {
      this.stream.on("dtmf", (key: string) => {
        callback(key);
      });
    }

    if (event === "error") {
      this.stream.on("error", (error: Error) => {
        callback(error);
      });
    }
  }

  emit(event: string, data: any) {
    this.stream.emit(event, data);
  }

  setDtmfSubscribeToken(token: string) {
    this.dtmfSubscribeToken = token;
  }

  setSpeechSubscribeToken(token: string) {
    this.speechSubscribeToken = token;
  }
}
