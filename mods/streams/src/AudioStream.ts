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
import * as fs from "fs";
import * as net from "net";
import { setTimeout } from "node:timers/promises";
import { Readable } from "stream";
import { Message } from "./Message";
import { EventType } from "./types";

const MAX_CHUNK_SIZE = 320;

/**
 * @classdesc Object representing a stream of bidirectional audio data and control messages.
 */
class AudioStream {
  private stream: Readable;
  private socket: net.Socket;

  /**
   * Creates a new AudioStream.
   *
   * @param {Readable} stream - A readable stream
   * @param {net.Socket} socket - A TCP socket
   */
  constructor(stream: Readable, socket: net.Socket) {
    this.stream = stream;
    this.socket = socket;
  }

  /**
   * Writes media data to the stream.
   *
   * @param {Buffer} data - The data to write
   */
  write(data: Buffer) {
    const buffer = Message.createSlinMessage(data);
    this.socket.write(buffer);
  }

  /**
   * Sends a hangup message to the stream and closes the connection.
   */
  hangup() {
    const buffer = Message.createHangupMessage();
    this.socket.write(buffer);
    this.socket.end();
    this.stream.emit(EventType.END);
  }

  /**
   * Utility for playing audio files.
   *
   * @param {string} filePath - The path to the audio file
   * @return {Promise<void>}
   */
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

  /**
   * Adds a listener for the data event.
   *
   * @param {function(Buffer): void} callback - The callback to be executed
   * @return {AudioStream} The AudioStream instance
   * @see EventType.DATA
   */
  onData(callback: (data: Buffer) => void): this {
    this.stream.on(EventType.DATA, callback);
    return this;
  }

  /**
   * Adds a listener for the end event.
   *
   * @param {function(): void} callback - The callback to be executed
   * @return {AudioStream} The AudioStream instance
   * @see EventType.END
   */
  onClose(callback: () => void): this {
    this.stream.on(EventType.END, callback);
    return this;
  }

  /**
   * Adds a listener for the error event.
   *
   * @param {function(Error): void} callback - The callback to be executed
   * @return {AudioStream} The AudioStream instance
   * @see EventType.ERROR
   */
  onError(callback: (err: Error) => void): this {
    this.stream.on(EventType.ERROR, callback);
    return this;
  }
}

export { AudioStream };
