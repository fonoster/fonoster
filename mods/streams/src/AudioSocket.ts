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
/* eslint-disable no-dupe-class-members */
import net from "net";
import { Readable } from "stream";
import { getLogger } from "@fonoster/logger";
import { AudioSocketError } from "./AudioSocketError";
import { AudioStream } from "./AudioStream";
import { nextMessage } from "./nextMessage";
import { EventType, MessageType, StreamRequest } from "./types";

const logger = getLogger({ service: "streams", filePath: __filename });

/**
 * @classdesc A NodeJS implementation of the AudioSocket protocol. The AudioSocket protocol is
 * a simple protocol for streaming audio from Asterisk to a NodeJS application. The protocol is
 * based on the I/O multiplexing model and uses
 *
 * @example
 *
 * const { AudioSocket } = require("@fonoster/streams");
 *
 * const audioSocket = new AudioSocket();
 *
 * audioSocket.onConnection(async (req, res) => {
 *   console.log("new connection from:", req.ref);
 *
 *   res.on("data", (data) => {
 *      // Do something with the audio data
 *   );
 *
 *   res.on("end", () => {
 *      // Do something when the stream ends
 *   });
 *
 *   res.on("error", (err) => {
 *      // Do something when an error occurs
 *   });
 *
 *   // Utility for playing audio files
 *   await res.play("/path/to/audio/file");
 * });
 *
 * audioSocket.listen(9092, () => {
 *   console.log("server listening on port 9092");
 * });
 */
class AudioSocket {
  private server: net.Server;
  private audioStream: AudioStream;
  private connectionHandler:
    | ((req: StreamRequest, stream: AudioStream) => void)
    | null = null;

  /**
   * Constructs a new AudioSocket instance.
   *
   * @see AudioStream
   */
  constructor() {
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  private handleConnection(socket: net.Socket) {
    logger.verbose("client connected");

    const asStream = new Readable({ read() {} });
    const audioStream = new AudioStream(asStream, socket);

    this.audioStream = audioStream;

    socket.on(EventType.DATA, (data) =>
      this.handleData(data, asStream, audioStream)
    );
    socket.on(EventType.END, () => asStream.emit(EventType.END));
    socket.on(EventType.ERROR, (err) => {
      if ("code" in err && err.code === "ERR_STREAM_WRITE_AFTER_END") {
        return;
      }
      logger.error("socket error:", err);
      asStream.emit(EventType.ERROR, err);
    });
  }

  private async handleData(
    data: Buffer,
    asStream: Readable,
    audioStream: AudioStream
  ) {
    const stream = new Readable({ read() {} });
    stream.push(data);
    stream.push(null); // End of the stream

    try {
      const message = await nextMessage(stream);

      switch (message.getKind()) {
        case MessageType.ID:
          if (this.connectionHandler) {
            this.connectionHandler({ ref: message.getId() }, audioStream);
          } else {
            logger.warn("no connection handler set");
          }
          break;
        case MessageType.SLIN:
        case MessageType.SILENCE:
          asStream.emit(EventType.DATA, message.getPayload());
          break;
        case MessageType.HANGUP:
          asStream.emit(EventType.END);
          break;
        case MessageType.ERROR:
          asStream.emit(
            EventType.ERROR,
            new AudioSocketError(message.getErrorCode())
          );
          break;
        default:
          logger.warn("unknown message type");
          break;
      }
    } catch (err) {
      logger.error("error processing message:", err);
    }
  }

  /**
   * Starts the server listening for connections on the specified port.
   *
   * @param {number} port - The port to listen on
   * @param {() => void} callback - The callback to invoke when the server is listening
   */
  listen(port: number, callback?: () => void): void;

  /**
   * Starts the server listening for connections on the specified port and bind address.
   *
   * @param {number} port - The port to listen on
   * @param {string} bind - The address to bind to
   * @param {() => void} callback - The callback to invoke when the server is listening
   */
  listen(port: number, bind: string, callback?: () => void): void;

  listen(
    port: number,
    bindOrCallback?: string | (() => void),
    callback?: () => void
  ) {
    const bind =
      typeof bindOrCallback === "string" ? bindOrCallback : "0.0.0.0";
    const cb = typeof bindOrCallback === "function" ? bindOrCallback : callback;

    this.server.listen(port, bind, cb);
  }

  /**
   * Sets the handler to be called when a new connection is established.
   *
   * @param {function(StreamRequest, AudioStream): void} handler - The handler to call when a new connection is established
   * @example
   *
   * audioSocket.onConnection(async (req, res) => {
   *   console.log("new connection from:", req.ref);
   *
   *   await res.play("/path/to/audio/file");
   * });
   */
  onConnection(handler: (req: StreamRequest, stream: AudioStream) => void) {
    this.connectionHandler = handler;
  }

  /**
   * Closes the server and stops listening for connections.
   */
  close() {
    this.audioStream?.hangup();
    this.server.close();
  }
}

export { AudioSocket };
