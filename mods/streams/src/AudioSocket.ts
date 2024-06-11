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
import { AudioStream } from "./AudioStream";
import { nextMessage } from "./nextMessage";
import { EventType, MessageType, StreamRequest } from "./types";

const logger = getLogger({ service: "streams", filePath: __filename });

class AudioSocket {
  private server: net.Server;
  private connectionHandler:
    | ((req: StreamRequest, stream: AudioStream) => void)
    | null = null;

  constructor() {
    this.server = net.createServer((socket) => {
      logger.info("client connected");

      const asStream = new Readable();
      const audioStream = new AudioStream(asStream, socket);

      socket.on(EventType.DATA, async (data) => {
        const stream = new Readable();
        stream.push(data);
        stream.push(null); // End of the stream

        try {
          const message = await nextMessage(stream);

          if (message.getKind() === MessageType.ID && this.connectionHandler) {
            this.connectionHandler({ ref: message.getId() }, audioStream);
          } else if (
            message.getKind() === MessageType.SLIN ||
            message.getKind() === MessageType.SILENCE
          ) {
            asStream.emit(EventType.DATA, message.getPayload());
          }
        } catch (err) {
          logger.error("error processing message:", err);
        }
      });

      socket.on(EventType.END, () => {
        logger.verbose("client disconnected");
      });

      socket.on(EventType.ERROR, (err) => {
        logger.error("socket error:", err);
      });
    });
  }

  listen(port: number, callback?: () => void) {
    // FIXME: Fix hardcode IP
    this.server.listen(port, "0.0.0.0", callback);
  }

  onConnection(handler: (req: StreamRequest, stream: AudioStream) => void) {
    this.connectionHandler = handler;
  }
}

export { AudioSocket };
