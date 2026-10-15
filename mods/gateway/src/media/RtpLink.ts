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
import * as dgram from "dgram";
import { EventEmitter } from "events";
import {
  Format,
  FRAME_MS,
  fromInternal,
  parseCodec,
  toInternal
} from "../audio/pcm";

/** The codec the gateway offers in participant.add: the internal format, so no transcoding. */
export const OFFERED_CODEC = "L16/16000";

/**
 * The gateway's audio link to its room (MN13): plain RTP over UDP, ports exchanged in
 * participant.add. Emits "frame" with internal-format caller audio.
 */
export class RtpLink extends EventEmitter {
  private socket = dgram.createSocket("udp4");
  private remote?: { host: string; port: number };
  private readonly format: Format;
  private seq = Math.floor(Math.random() * 0xffff);
  private timestamp = Math.floor(Math.random() * 0xffffffff);
  private readonly ssrc = Math.floor(Math.random() * 0xffffffff);
  private closed = false;

  constructor(codec = OFFERED_CODEC) {
    super();
    this.format = parseCodec(codec);
  }

  get codec(): string {
    return OFFERED_CODEC;
  }

  /** Binds a local port and returns the rtp block to offer. */
  async bind(
    host = "127.0.0.1",
    advertiseHost?: string
  ): Promise<{
    host: string;
    port: number;
    codec: string;
    payloadType: number;
    ptime: number;
    ssrc: number;
  }> {
    this.socket.on("message", (msg) => this.onPacket(msg));
    this.socket.on("error", () => this.close());
    await new Promise<void>((resolve) => this.socket.bind(0, host, resolve));
    return {
      host: advertiseHost ?? host,
      port: this.socket.address().port,
      codec: OFFERED_CODEC,
      // The rtp block of media-control ("Gateway audio is RTP negotiated in participant.add").
      payloadType: this.format.codec === "pcmu" ? 0 : 96,
      ptime: 20,
      ssrc: this.ssrc >>> 0
    };
  }

  connect(remote: { host: string; port: number }) {
    this.remote = remote;
  }

  /** Sends one internal 20 ms frame. */
  send(frame: Buffer) {
    if (!this.remote || this.closed) return;
    const payload = fromInternal(frame, this.format);
    const header = Buffer.alloc(12);
    header[0] = 0x80;
    header[1] = this.format.codec === "pcmu" ? 0 : 96;
    header.writeUInt16BE(this.seq, 2);
    header.writeUInt32BE(this.timestamp >>> 0, 4);
    header.writeUInt32BE(this.ssrc >>> 0, 8);
    this.seq = (this.seq + 1) & 0xffff;
    this.timestamp =
      (this.timestamp + (this.format.rate / 1000) * FRAME_MS) >>> 0;
    this.socket.send(
      Buffer.concat([header, payload]),
      this.remote.port,
      this.remote.host
    );
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.socket.close();
    } catch {
      // already closed
    }
    this.removeAllListeners();
  }

  private onPacket(msg: Buffer) {
    if (msg.length < 12 || msg[0] >> 6 !== 2) return;
    let offset = 12 + (msg[0] & 0x0f) * 4;
    if (msg[0] & 0x10) offset += 4 + msg.readUInt16BE(offset + 2) * 4;
    const payloadType = msg[1] & 0x7f;
    const from: Format =
      payloadType === 0 ? { codec: "pcmu", rate: 8000 } : this.format;
    this.emit("frame", toInternal(msg.subarray(offset), from));
  }
}
