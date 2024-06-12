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
import * as fs from "fs";
import * as net from "net";
import { setTimeout } from "node:timers/promises";
import { Readable } from "stream";
import { Message } from "./Message";
import { EventType } from "./types";

// TODO: Update this file to support slin16 format
const MAX_CHUNK_SIZE = 320;

class AudioStream {
  private stream: Readable;
  private socket: net.Socket;

  constructor(stream: Readable, socket: net.Socket) {
    this.stream = stream;
    this.socket = socket;
  }

  write(data: Buffer) {
    const buffer = Message.createSlinMessage(data);
    this.socket.write(buffer);
  }

  hangup() {
    const buffer = Message.createHangupMessage();
    this.socket.write(buffer);
    this.socket.end();
  }

  async play(filePath: string) {
    const fileStream = fs.readFileSync(filePath);

    let offset = 0;

    // eslint-disable-next-line no-loops/no-loops
    while (offset < fileStream.length) {
      const sliceSize = Math.min(fileStream.length - offset, MAX_CHUNK_SIZE);
      const slicedChunk = fileStream.subarray(offset, offset + sliceSize);
      const buffer = Message.createSlinMessage(slicedChunk);
      this.socket.write(buffer);
      offset += sliceSize;

      // Wait for 20ms to match the sample rate
      await setTimeout(20);
    }
  }

  onData(callback: (data: Buffer) => void): this {
    this.stream.on(EventType.DATA, callback);
    return this;
  }

  onClose(callback: () => void): this {
    this.stream.on(EventType.END, callback);
    return this;
  }

  onError(callback: (err: Error) => void): this {
    this.stream.on(EventType.ERROR, callback);
    return this;
  }
}

export { AudioStream };
