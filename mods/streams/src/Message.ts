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
import { parse as uuidParse, stringify as uuidStringify } from "uuid";
import { ErrorCodes, MessageType } from "./types";

class Message {
  private data: Buffer;

  constructor(data: Buffer) {
    this.data = data;
  }

  // Get content length of the message
  getContentLength(): number {
    if (this.data.length < 3) return 0;
    return this.data.readUInt16BE(1);
  }

  // Get the type of the message
  getKind(): number {
    if (this.data.length < 1) return MessageType.ERROR;
    return this.data[0];
  }

  // Get error code from the message, if present
  getErrorCode(): number {
    if (this.getKind() !== MessageType.ERROR) return ErrorCodes.NONE;
    if (this.data.length < 4) return ErrorCodes.UNKNOWN;
    return this.data[3];
  }

  // Get the payload of the message
  getPayload(): Buffer | null {
    const size = this.getContentLength();
    if (size === 0) return null;
    // Why slice(3) here?
    return this.data.slice(3);
  }

  // Get the unique ID from the message if it is an ID message
  getId(): string {
    if (this.getKind() !== MessageType.ID) {
      throw new Error(`Wrong message type ${this.getKind()}`);
    }
    return uuidStringify(this.getPayload());
  }

  // Static method to create a Hangup message
  static createHangupMessage(): Buffer {
    // The minimum message length is three bytes
    return Buffer.from([MessageType.HANGUP, 0x00, 0x00]);
  }

  // WARNING: Here to match the go implementation but so far not used
  static createIDMessage(id: string): Buffer {
    const idBuffer = Buffer.from(uuidParse(id));
    const out = Buffer.alloc(3 + idBuffer.length);
    out[0] = MessageType.ID;
    out.writeUInt16BE(idBuffer.length, 1);
    idBuffer.copy(out, 3);
    return out;
  }

  // Static method to create a Slin message
  static createSlinMessage(data: Buffer): Buffer {
    if (data.length > 65535) throw new Error("Message too large");
    const out = Buffer.alloc(3 + data.length);
    out[0] = MessageType.SLIN;
    out.writeUInt16BE(data.length, 1);
    data.copy(out, 3);
    return out;
  }
}

export { Message };
