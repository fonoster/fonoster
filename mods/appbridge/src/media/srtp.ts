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
import * as crypto from "crypto";

/** The one SDES suite media-control uses (roomr MN6, media-control "rtp" block). */
export const SRTP_SUITE = "AES_CM_128_HMAC_SHA1_80";

const KEY_LEN = 16;
const SALT_LEN = 14;
const AUTH_KEY_LEN = 20;
const TAG_LEN = 10;

/** A fresh base64 master key and salt (30 bytes), as media-control's `srtp.key`. */
export function newSrtpKey(): string {
  return crypto.randomBytes(KEY_LEN + SALT_LEN).toString("base64");
}

/** RFC 3711 4.3.1 key derivation with a key derivation rate of 0. */
function derive(
  masterKey: Buffer,
  masterSalt: Buffer,
  label: number,
  length: number
) {
  const iv = Buffer.alloc(16);
  masterSalt.copy(iv, 0);
  iv[7] ^= label;
  const cipher = crypto.createCipheriv("aes-128-ctr", masterKey, iv);
  return cipher.update(Buffer.alloc(length));
}

function headerLength(packet: Buffer): number {
  let offset = 12 + (packet[0] & 0x0f) * 4;
  if (packet[0] & 0x10) offset += 4 + packet.readUInt16BE(offset + 2) * 4;
  return offset;
}

/**
 * One direction of an SRTP stream (AES_CM_128_HMAC_SHA1_80, RFC 3711): `protect` for what we
 * send, `unprotect` for what we receive. It keeps the rollover counter per SSRC.
 */
export class SrtpContext {
  private readonly key: Buffer;
  private readonly salt: Buffer;
  private readonly authKey: Buffer;
  private readonly streams = new Map<
    number,
    { roc: number; lastSeq: number }
  >();

  constructor(base64Key: string) {
    const master = Buffer.from(base64Key, "base64");
    if (master.length !== KEY_LEN + SALT_LEN) {
      throw new Error("srtp key must be 30 bytes of base64");
    }
    const masterKey = master.subarray(0, KEY_LEN);
    const masterSalt = master.subarray(KEY_LEN);
    this.key = derive(masterKey, masterSalt, 0, KEY_LEN);
    this.authKey = derive(masterKey, masterSalt, 1, AUTH_KEY_LEN);
    this.salt = derive(masterKey, masterSalt, 2, SALT_LEN);
  }

  private iv(ssrc: number, index: number): Buffer {
    const iv = Buffer.alloc(16);
    this.salt.copy(iv, 0);
    iv[4] ^= (ssrc >>> 24) & 0xff;
    iv[5] ^= (ssrc >>> 16) & 0xff;
    iv[6] ^= (ssrc >>> 8) & 0xff;
    iv[7] ^= ssrc & 0xff;
    // 48-bit packet index in bytes 8..13.
    const hi = Math.floor(index / 0x100000000);
    const lo = index >>> 0;
    iv[8] ^= (hi >>> 8) & 0xff;
    iv[9] ^= hi & 0xff;
    iv[10] ^= (lo >>> 24) & 0xff;
    iv[11] ^= (lo >>> 16) & 0xff;
    iv[12] ^= (lo >>> 8) & 0xff;
    iv[13] ^= lo & 0xff;
    return iv;
  }

  private tag(authenticated: Buffer, roc: number): Buffer {
    const rocBuf = Buffer.alloc(4);
    rocBuf.writeUInt32BE(roc >>> 0);
    return crypto
      .createHmac("sha1", this.authKey)
      .update(authenticated)
      .update(rocBuf)
      .digest()
      .subarray(0, TAG_LEN);
  }

  private crypt(packet: Buffer, hlen: number, ssrc: number, index: number) {
    const cipher = crypto.createCipheriv(
      "aes-128-ctr",
      this.key,
      this.iv(ssrc, index)
    );
    return cipher.update(packet.subarray(hlen));
  }

  /** Encrypts and authenticates one RTP packet. */
  protect(packet: Buffer): Buffer {
    const seq = packet.readUInt16BE(2);
    const ssrc = packet.readUInt32BE(8);
    const s = this.streams.get(ssrc) ?? { roc: 0, lastSeq: seq };
    if (seq < s.lastSeq && s.lastSeq - seq > 0x8000) s.roc = (s.roc + 1) >>> 0;
    s.lastSeq = seq;
    this.streams.set(ssrc, s);
    const hlen = headerLength(packet);
    const index = s.roc * 0x10000 + seq;
    const out = Buffer.concat([
      packet.subarray(0, hlen),
      this.crypt(packet, hlen, ssrc, index)
    ]);
    return Buffer.concat([out, this.tag(out, s.roc)]);
  }

  /** Verifies and decrypts one SRTP packet; undefined when it does not authenticate. */
  unprotect(packet: Buffer): Buffer | undefined {
    if (packet.length < 12 + TAG_LEN || packet[0] >> 6 !== 2) return undefined;
    const seq = packet.readUInt16BE(2);
    const ssrc = packet.readUInt32BE(8);
    const s = this.streams.get(ssrc);
    // RFC 3711 3.3.1: guess the rollover counter from the highest sequence number seen.
    let roc = s?.roc ?? 0;
    if (s) {
      if (s.lastSeq < 0x8000) {
        if (seq - s.lastSeq > 0x8000) roc = (s.roc - 1) >>> 0;
      } else if (s.lastSeq - 0x8000 > seq) {
        roc = (s.roc + 1) >>> 0;
      }
    }
    const body = packet.subarray(0, packet.length - TAG_LEN);
    const tag = packet.subarray(packet.length - TAG_LEN);
    if (!crypto.timingSafeEqual(tag, this.tag(body, roc))) return undefined;
    if (!s || roc > s.roc || (roc === s.roc && seq > s.lastSeq)) {
      this.streams.set(ssrc, { roc, lastSeq: seq });
    }
    const hlen = headerLength(body);
    return Buffer.concat([
      body.subarray(0, hlen),
      this.crypt(body, hlen, ssrc, roc * 0x10000 + seq)
    ]);
  }
}
