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
import { getLogger } from "@fonoster/logger";
import { Message } from "./Message";

const logger = getLogger({ service: "streams", filePath: __filename });

const MAX_CHUNK_SIZE = 320;

/**
 * @classdesc Object representing an audio player that can play audio files and streams.
 */
export class AudioPlayer {
  private activeStream: Readable | null = null;
  private socket: net.Socket;
  private isPlaying: boolean = false;

  /**
   * Creates a new AudioPlayer.
   *
   * @param {net.Socket} socket - A TCP socket for writing audio data
   */
  constructor(socket: net.Socket) {
    this.socket = socket;
  }

  /**
   * Utility for playing audio files.
   *
   * @param {string} filePath - The path to the audio file
   * @return {Promise<void>}
   */
  async play(filePath: string): Promise<void> {
    const fileStream = fs.readFileSync(filePath);

    logger.verbose("playing audio file", { filePath });

    let offset = 0;

    // eslint-disable-next-line no-loops/no-loops
    while (offset < fileStream.length) {
      const sliceSize = Math.min(fileStream.length - offset, MAX_CHUNK_SIZE);
      const slicedChunk = fileStream.subarray(offset, offset + sliceSize);
      await this._processAudioChunk(slicedChunk);
      offset += sliceSize;
    }
  }

  /**
   * Plays audio from an input stream and returns an output stream.
   * The playback can be stopped using stopPlayStream().
   *
   * @param {Readable} inputStream - The input stream to read audio from
   * @return {Promise<void>}
   */
  async playStream(inputStream: Readable): Promise<void> {
    this.isPlaying = true;
    this.activeStream = inputStream;

    const buffer: Buffer[] = [];
    let isProcessing = false;

    const processBuffer = async () => {
      if (!this.isPlaying || isProcessing || buffer.length === 0) return;

      isProcessing = true;

      try {
        while (buffer.length > 0 && this.isPlaying) {
          const chunk = buffer.shift()!;
          await this._processAudioChunk(chunk);
        }
      } finally {
        isProcessing = false;
      }
    };

    return new Promise((resolve, reject) => {
      inputStream.on("data", async (chunk: Buffer) => {
        if (!this.isPlaying || this.activeStream !== inputStream) return;

        for (let offset = 0; offset < chunk.length; offset += MAX_CHUNK_SIZE) {
          const sliceSize = Math.min(chunk.length - offset, MAX_CHUNK_SIZE);
          const slicedChunk = chunk.subarray(offset, offset + sliceSize);
          buffer.push(slicedChunk);
        }

        if (!isProcessing) {
          await processBuffer();
          resolve();
        }
      });

      inputStream.on("error", (err) => {
        logger.error("error playing stream", err);
        this._cleanupActiveStream();
        reject(err);
      });

      inputStream.on("end", () => {
        this._cleanupActiveStream();
      });
    });
  }

  /**
   * Stops the current stream playback.
   */
  stop() {
    this.isPlaying = false;
    this._cleanupActiveStream();
  }

  private async _processAudioChunk(chunk: Buffer) {
    const buffer = Message.createSlinMessage(chunk);
    this.socket.write(buffer);
    await setTimeout(20);
  }

  private _cleanupActiveStream() {
    if (this.activeStream) {
      this.activeStream.removeAllListeners("data");
      this.activeStream.removeAllListeners("error");
      this.activeStream.removeAllListeners("end");
      if (typeof this.activeStream.pause === "function") {
        this.activeStream.pause();
      }
      this.activeStream = null;
    }
  }
}
