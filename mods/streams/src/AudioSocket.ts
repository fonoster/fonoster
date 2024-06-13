/* eslint-disable no-dupe-class-members */
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
import net from "net";
import { Readable } from "stream";
import { getLogger } from "@fonoster/logger";
import { AudioSocketError } from "./AudioSocketError";
import { AudioStream } from "./AudioStream";
import { nextMessage } from "./nextMessage";
import { EventType, MessageType, StreamRequest } from "./types";

const logger = getLogger({ service: "streams", filePath: __filename });

/**
 * @classdesc Use the VoiceResponse object, to construct advance Interactive
 * Voice Response (IVR) applications.
 *
 * @extends Verb
 * @example
 *
 * import { VoiceServer } from "@fonoster/voice";
 *
 * async function handler (request, response) {
 *   await response.answer();
 *   await response.play("sound:hello-world");
 * }
 *
 * const voiceServer = new VoiceServer({base: '/voiceapp'})
 * voiceServer.listen(handler, { port: 3000 })
 */
class AudioSocket {
  private server: net.Server;
  private connectionHandler:
    | ((req: StreamRequest, stream: AudioStream) => void)
    | null = null;

  constructor() {
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  private handleConnection(socket: net.Socket) {
    logger.info("client connected");

    const asStream = new Readable({ read() {} });
    const audioStream = new AudioStream(asStream, socket);

    socket.on(EventType.DATA, (data) =>
      this.handleData(data, asStream, audioStream)
    );
    socket.on(EventType.END, () => asStream.emit(EventType.END));
    socket.on(EventType.ERROR, (err) => {
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
          this.connectionHandler?.({ ref: message.getId() }, audioStream);
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

  // Overload signatures
  listen(port: number, callback?: () => void): void;
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

  onConnection(handler: (req: StreamRequest, stream: AudioStream) => void) {
    this.connectionHandler = handler;
  }

  close() {
    this.server.close();
  }
}

export { AudioSocket };
