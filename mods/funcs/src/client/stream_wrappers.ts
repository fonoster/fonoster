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
import { FuncsPB } from "./funcs";

export class DeployStream {
  stream: any;
  constructor(stream) {
    this.stream = stream;
  }

  onMessage(callback) {
    this.stream.on("data", (data: FuncsPB.DeployStream) => {
      callback({ text: data.getText() });
    });
  }

  onFinish(callback) {
    this.stream.on("end", () => {
      callback();
    });
  }

  onError(callback) {
    this.stream.on("error", (e: Error) => {
      callback(e);
    });
  }
}

export class LogsStream {
  stream: any;
  constructor(stream) {
    this.stream = stream;
  }

  onMessage(callback) {
    this.stream.on("data", (data: FuncsPB.FuncLog) => {
      callback({
        name: data.getName(),
        instance: data.getInstance(),
        timestamp: data.getTimestamp(),
        text: data.getText()
      });
    });
  }

  onFinish(callback) {
    this.stream.on("end", () => {
      callback();
    });
  }

  onError(callback) {
    this.stream.on("error", (e: Error) => {
      callback(e);
    });
  }
}
