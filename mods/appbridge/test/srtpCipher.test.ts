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
import { expect } from "chai";
import { newSrtpKey, SrtpContext } from "../src/media/srtp";

// AppBridge's SRTP cipher (AES_CM_128_HMAC_SHA1_80) alone. Its interop with the Go Roomr node
// is srtp.test.ts.

function rtpPacket(seq: number, payload: Buffer, ssrc = 0x1234): Buffer {
  const header = Buffer.alloc(12);
  header[0] = 0x80;
  header[1] = 96;
  header.writeUInt16BE(seq & 0xffff, 2);
  header.writeUInt32BE(seq * 320, 4);
  header.writeUInt32BE(ssrc, 8);
  return Buffer.concat([header, payload]);
}

describe("@appbridge SRTP (AES_CM_128_HMAC_SHA1_80)", function () {
  it("round-trips packets, across a sequence number wrap", function () {
    const key = newSrtpKey();
    const tx = new SrtpContext(key);
    const rx = new SrtpContext(key);
    for (const seq of [65533, 65534, 65535, 0, 1, 2]) {
      const plain = rtpPacket(seq, Buffer.from(`frame ${seq}`));
      const secret = tx.protect(plain);
      expect(secret.length).to.equal(plain.length + 10);
      expect(secret.subarray(12, plain.length)).to.not.deep.equal(
        plain.subarray(12)
      );
      expect(rx.unprotect(secret)).to.deep.equal(plain);
    }
  });

  it("drops plain, tampered and wrongly keyed packets", function () {
    const key = newSrtpKey();
    const rx = new SrtpContext(key);
    const plain = rtpPacket(7, Buffer.alloc(40, 1));
    expect(rx.unprotect(plain)).to.equal(undefined);
    const secret = new SrtpContext(key).protect(plain);
    secret[20] ^= 1;
    expect(rx.unprotect(secret)).to.equal(undefined);
    expect(rx.unprotect(new SrtpContext(newSrtpKey()).protect(plain))).to.equal(
      undefined
    );
  });
});
