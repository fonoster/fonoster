/*
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
import {
  FRAME_BYTES,
  convert,
  decodeWav,
  msOf,
  parseCodec,
  resample,
  rms,
  toFrames
} from "../src";
import { withTrackId } from "../src/protocols/fonoster";

function wav(samples: Int16Array, rate: number): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(s, i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// The pre-optimization conversion, kept as the reference the fast paths must match exactly.
function referenceConvert(
  buf: Buffer,
  from: { codec: string; rate: number },
  to: { codec: string; rate: number }
): Buffer {
  if (from.codec === to.codec && from.rate === to.rate) return buf;
  const mulaw = (sample: number) => {
    const sign = sample < 0 ? 0x80 : 0;
    const s = Math.min(Math.abs(sample), 32635) + 0x84;
    let exponent = 7;
    for (let mask = 0x4000; (s & mask) === 0 && exponent > 0; mask >>= 1)
      exponent--;
    return ~(sign | (exponent << 4) | ((s >> (exponent + 3)) & 0x0f)) & 0xff;
  };
  const decodeMulaw = (byte: number) => {
    const u = ~byte & 0xff;
    const exponent = (u >> 4) & 0x07;
    const magnitude = ((((u & 0x0f) << 3) + 0x84) << exponent) - 0x84;
    return u & 0x80 ? -magnitude : magnitude;
  };
  let samples: Int16Array;
  if (from.codec === "pcmu") samples = Int16Array.from(buf, decodeMulaw);
  else {
    samples = new Int16Array(Math.floor(buf.length / 2));
    for (let i = 0; i < samples.length; i++)
      samples[i] =
        from.codec === "l16" ? buf.readInt16BE(i * 2) : buf.readInt16LE(i * 2);
  }
  samples = resample(samples, from.rate, to.rate);
  if (to.codec === "pcmu") return Buffer.from(Array.from(samples, mulaw));
  const out = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    if (to.codec === "l16") out.writeInt16BE(samples[i], i * 2);
    else out.writeInt16LE(samples[i], i * 2);
  }
  return out;
}

describe("@appbridge/audio", function () {
  it("converts exactly as the reference between every format pair", function () {
    const formats = [
      { codec: "pcm16", rate: 8000 },
      { codec: "pcm16", rate: 16000 },
      { codec: "pcm16", rate: 24000 },
      { codec: "l16", rate: 16000 },
      { codec: "l16", rate: 8000 },
      { codec: "pcmu", rate: 8000 }
    ] as const;
    // Every 16-bit pattern, including the extremes, plus an odd trailing byte.
    const all = Buffer.alloc(65536 * 2 + 1);
    for (let u = 0; u < 65536; u++) all.writeUInt16LE(u, u * 2);
    all[all.length - 1] = 0x7f;
    for (const from of formats)
      for (const to of formats)
        expect(
          convert(all, from, to).equals(referenceConvert(all, from, to)),
          `${from.codec}/${from.rate} -> ${to.codec}/${to.rate}`
        ).to.equal(true);
  });

  it("converts without touching its input", function () {
    const be = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    convert(be, { codec: "l16", rate: 16000 }, { codec: "pcm16", rate: 16000 });
    expect(be).to.deep.equal(Buffer.from([0x01, 0x02, 0x03, 0x04]));
  });

  it("prefixes app audio frames with their track id", function () {
    expect(withTrackId(2, Buffer.from([7, 8]))).to.deep.equal(
      Buffer.from([2, 7, 8])
    );
  });

  it("parses codec names", function () {
    expect(parseCodec("L16/16000")).to.deep.equal({
      codec: "l16",
      rate: 16000
    });
    expect(parseCodec("PCMU/8000")).to.deep.equal({
      codec: "pcmu",
      rate: 8000
    });
    expect(parseCodec("pcm16", 24000)).to.deep.equal({
      codec: "pcm16",
      rate: 24000
    });
    expect(() => parseCodec("opus/48000")).to.throw("unsupported");
  });

  it("round-trips μ-law 8 kHz within quantization error", function () {
    const tone = Buffer.alloc(FRAME_BYTES);
    for (let i = 0; i < FRAME_BYTES / 2; i++)
      tone.writeInt16LE(Math.round(8000 * Math.sin(i / 5)), i * 2);
    const mulaw = convert(
      tone,
      { codec: "pcm16", rate: 16000 },
      { codec: "pcmu", rate: 8000 }
    );
    expect(mulaw.length).to.equal(160);
    const back = convert(
      mulaw,
      { codec: "pcmu", rate: 8000 },
      { codec: "pcm16", rate: 16000 }
    );
    expect(back.length).to.equal(FRAME_BYTES);
    expect(Math.abs(rms(back) - rms(tone)) / rms(tone)).to.be.lessThan(0.1);
  });

  it("converts L16 big-endian to internal little-endian", function () {
    const be = Buffer.from([0x01, 0x02]);
    expect(
      convert(
        be,
        { codec: "l16", rate: 16000 },
        { codec: "pcm16", rate: 16000 }
      )
    ).to.deep.equal(Buffer.from([0x02, 0x01]));
  });

  it("resamples by rate ratio", function () {
    expect(resample(new Int16Array(160), 8000, 16000)).to.have.length(320);
    expect(resample(new Int16Array(480), 24000, 16000)).to.have.length(320);
  });

  it("decodes WAV at any rate into 16 kHz", function () {
    const audio = decodeWav(wav(new Int16Array(8000), 8000));
    expect(msOf(audio.length)).to.equal(1000);
    expect(() => decodeWav(Buffer.from("nope"))).to.throw("not a WAV");
  });

  it("pads the last frame with silence", function () {
    const frames = toFrames(Buffer.alloc(FRAME_BYTES + 10, 1));
    expect(frames).to.have.length(2);
    expect(frames[1].length).to.equal(FRAME_BYTES);
    expect(frames[1][20]).to.equal(0);
  });
});
