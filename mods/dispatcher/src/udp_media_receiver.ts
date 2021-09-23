/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import fs from "fs";
import dgram from "dgram";
import logger from "@fonos/logger";
const pipe = require("stream").prototype.pipe;

export default class UDPMediaReceiver {
  server: any;
  swap16: boolean;
  alsoWritePath: string;
  address: string;
  port: number;
  fileStream: fs.WriteStream;
  constructor(host: string, swap16?: boolean, alsoWritePath?: string) {
    //let timer = setTimeout(() => {
    //  this.close();
    //}, 30000);
    this.server = dgram.createSocket("udp4");
    // Add the Stream.pipe() method to the socket
    this.server.pipe = pipe;

    this.swap16 = swap16 || false;
    this.alsoWritePath = alsoWritePath;
    this.address = host.split(":")[0];
    this.port = parseInt(host.split(":")[1]);

    if (this.alsoWritePath) {
      this.fileStream = fs.createWriteStream(this.alsoWritePath, {
        autoClose: true
      });
    }

    this.server.on("error", (err) => {
      logger.error(`@fonos/dispatcher udpServer [server error:\n${err.stack}]`);
      this.server.close();
      if (this.fileStream) {
        this.fileStream.close();
      }
    });

    this.server.on("close", (err) => {
      logger.verbose(`@fonos/dispatcher udpServer [server socket closed]`);
      if (this.fileStream) {
        this.fileStream.close();
      }
    });

    this.server.on("message", (msg, rinfo) => {
      /* Strip the 12 byte RTP header */
      let buf = msg.slice(12);
      if (this.swap16) {
        buf.swap16();
      }
      if (this.fileStream) {
        this.fileStream.write(buf);
      }
      this.server.emit("data", buf);

      // WARNING: Hack to automatically close the port
      /*logger.verbose(timer)
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.close();
      }, 30000);*/
    });

    this.server.on("listening", () => {
      logger.verbose("DBG003")
      const address = this.server.address();
      logger.verbose(
        `@fonos/dispatcher udpServer [address = ${address.address}:${address.port}]`
      );
    });

    logger.verbose("DBG004")
    this.server.bind(this.port, this.address);
    logger.verbose("DBG005")
  }

  getServer() {
    return this.server;
  }

  close() {
    logger.verbose(`@fonos/dispatcher udpServer [closing server socket]`);
    this.server.close();
  }
}
