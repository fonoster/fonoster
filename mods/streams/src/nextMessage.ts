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
import { Readable } from "stream";
import { Message } from "./Message";
import { MINIMUM_MESSAGE_LENGTH } from "./types";

async function nextMessage(stream: Readable): Promise<Message> {
  const hdr = Buffer.alloc(MINIMUM_MESSAGE_LENGTH);
  const bytesRead = (await stream.read(MINIMUM_MESSAGE_LENGTH)) as Buffer;

  if (bytesRead.length !== MINIMUM_MESSAGE_LENGTH) {
    throw new Error(
      `Read wrong number of bytes (${bytesRead.length}) for header`
    );
  }

  hdr.set(bytesRead);

  const payloadLen = hdr.readUInt16BE(1);

  if (payloadLen < 1) return new Message(hdr);

  const payload = Buffer.alloc(payloadLen);
  const payloadRead = (await stream.read(payloadLen)) as Buffer;

  if (payloadRead.length !== payloadLen) {
    throw new Error(
      `Read wrong number of bytes (${payloadRead.length}) for payload`
    );
  }

  payload.set(payloadRead);

  return new Message(Buffer.concat([hdr, payload]));
}

export { nextMessage };
