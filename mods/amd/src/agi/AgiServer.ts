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
import { EventEmitter } from "events";
import * as net from "net";
import { AgiChannel } from "./AgiChannel";

/**
 * Minimal FastAGI (`agi://host:port`) server: Asterisk connects, sends a
 * block of `agi_*` header lines terminated by a blank line, then this emits
 * "call" with an AgiChannel the caller can issue EXEC/SET VARIABLE commands
 * on. See AgiChannel.ts for why this is hand-rolled rather than a dependency.
 */
class AgiServer extends EventEmitter {
  private server: net.Server;

  constructor(props: { port: number }) {
    super();
    this.server = net.createServer(this.handleConnection.bind(this));
    this.server.on("error", (err) => this.emit("error", err));
    this.server.listen(props.port, () => this.emit("ready", props.port));
  }

  private handleConnection(socket: net.Socket) {
    let buffer = "";

    const onData = (data: Buffer) => {
      buffer += data.toString();
      const delimiter = buffer.match(/\r?\n\r?\n/);
      if (!delimiter || delimiter.index === undefined) return;

      socket.off("data", onData);
      socket.off("error", onError);

      const header = buffer.slice(0, delimiter.index);
      const remainder = buffer.slice(delimiter.index + delimiter[0].length);
      const variables: Record<string, string> = {};

      header.split(/\r?\n/).forEach((line) => {
        if (!line.startsWith("agi_")) return;
        const separator = line.indexOf(":");
        if (separator < 0) return;
        variables[line.slice(4, separator).trim()] = line
          .slice(separator + 1)
          .trim();
      });

      const channel = new AgiChannel({ socket, variables });
      this.emit("call", channel);

      if (remainder) socket.unshift(Buffer.from(remainder));
    };

    const onError = (err: Error) => {
      if (this.listenerCount("error")) this.emit("error", err);
    };

    socket.once("error", onError);
    socket.on("data", onData);
  }

  close(): void {
    this.server.close();
  }
}

export { AgiServer };
