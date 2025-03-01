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
import { parse as uuidParse, stringify as uuidStringify } from "uuid";
import {
  ErrorCode,
  MAXIMUM_MESSAGE_LENGTH,
  MessageType,
  MINIMUM_MESSAGE_LENGTH
} from "./types";

class Message {
  private data: Buffer;

  constructor(data: Buffer) {
    this.data = data;
  }

  getContentLength(): number {
    return this.data.length >= MINIMUM_MESSAGE_LENGTH
      ? this.data.readUInt16BE(1)
      : 0;
  }

  getKind(): MessageType {
    return this.data.length > 0 ? this.data[0] : MessageType.ERROR;
  }

  getErrorCode(): ErrorCode {
    if (this.getKind() !== MessageType.ERROR) return ErrorCode.NONE;
    return this.data.length >= 4
      ? this.data[MINIMUM_MESSAGE_LENGTH]
      : ErrorCode.UNKNOWN;
  }

  getPayload(): Buffer | null {
    const size = this.getContentLength();
    return size > 0 ? this.data.subarray(MINIMUM_MESSAGE_LENGTH) : null;
  }

  getId(): string {
    if (this.getKind() !== MessageType.ID) {
      throw new Error(`Wrong message type ${this.getKind()}`);
    }
    return uuidStringify(this.getPayload());
  }

  private static createMessage(type: MessageType, data: Buffer): Buffer {
    if (data.length > MAXIMUM_MESSAGE_LENGTH) {
      throw new Error("Message too large");
    }
    const out = Buffer.alloc(MINIMUM_MESSAGE_LENGTH + data.length);
    out[0] = type;
    out.writeUInt16BE(data.length, 1);
    data.copy(out, MINIMUM_MESSAGE_LENGTH);
    return out;
  }

  static createHangupMessage(): Buffer {
    return Buffer.from([MessageType.HANGUP, 0x00, 0x00]);
  }

  static createIDMessage(id: string): Buffer {
    const idBuffer = Buffer.from(uuidParse(id));
    return this.createMessage(MessageType.ID, idBuffer);
  }

  static createSlinMessage(data: Buffer): Buffer {
    return this.createMessage(MessageType.SLIN, data);
  }
}

export { Message };
