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
// The gateway works internally in PCM16 little-endian, mono, 16 kHz. Everything that enters
// (caller RTP, app audio, TTS, played files) is converted to it, and everything that leaves is
// converted from it.

export const INTERNAL_RATE = 16000;
export const FRAME_MS = 20;
/** Bytes in one 20 ms internal frame. */
export const FRAME_BYTES = (INTERNAL_RATE / 1000) * FRAME_MS * 2;

export type Codec = "pcm16" | "l16" | "pcmu";
export type Format = { codec: Codec; rate: number };

export const INTERNAL: Format = { codec: "pcm16", rate: INTERNAL_RATE };

/** Parses codec names from sessions and SDP-style strings: "pcm16", "PCMU/8000", "L16/16000". */
export function parseCodec(name: string, rate?: number): Format {
  const [codec, r] = name.split("/");
  const lower = codec.toLowerCase();
  const normalized: Codec | undefined =
    lower === "pcm16" || lower === "linear16"
      ? "pcm16"
      : lower === "l16"
        ? "l16"
        : lower === "pcmu" || lower === "mulaw" || lower === "ulaw"
          ? "pcmu"
          : undefined;
  if (!normalized) throw new Error(`unsupported codec ${name}`);
  return {
    codec: normalized,
    rate: rate ?? (r ? Number(r) : normalized === "pcmu" ? 8000 : 16000)
  };
}

export function bytesPerMs(format: Format): number {
  return (format.rate / 1000) * (format.codec === "pcmu" ? 1 : 2);
}

export function msOf(bytes: number, format: Format = INTERNAL): number {
  return bytes / bytesPerMs(format);
}

const BIAS = 0x84;
const CLIP = 32635;

function linearToMulaw(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  const s = Math.min(Math.abs(sample), CLIP) + BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (s & mask) === 0 && exponent > 0; mask >>= 1)
    exponent--;
  const mantissa = (s >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

const MULAW_TABLE = Int16Array.from({ length: 256 }, (_, byte) => {
  const u = ~byte & 0xff;
  const exponent = (u >> 4) & 0x07;
  const magnitude = ((((u & 0x0f) << 3) + BIAS) << exponent) - BIAS;
  return u & 0x80 ? -magnitude : magnitude;
});

function toSamples(buf: Buffer, codec: Codec): Int16Array {
  if (codec === "pcmu") return Int16Array.from(buf, (b) => MULAW_TABLE[b]);
  const n = Math.floor(buf.length / 2);
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++)
    out[i] = codec === "l16" ? buf.readInt16BE(i * 2) : buf.readInt16LE(i * 2);
  return out;
}

function fromSamples(samples: Int16Array, codec: Codec): Buffer {
  if (codec === "pcmu") return Buffer.from(Array.from(samples, linearToMulaw));
  const out = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    if (codec === "l16") out.writeInt16BE(samples[i], i * 2);
    else out.writeInt16LE(samples[i], i * 2);
  }
  return out;
}

/** Linear-interpolation resampling. Good enough for telephony bandwidth. */
export function resample(
  samples: Int16Array,
  from: number,
  to: number
): Int16Array {
  if (from === to) return samples;
  const n = Math.round((samples.length * to) / from);
  const out = new Int16Array(n);
  const step = from / to;
  for (let i = 0; i < n; i++) {
    const pos = i * step;
    const j = Math.floor(pos);
    const frac = pos - j;
    const a = samples[Math.min(j, samples.length - 1)] ?? 0;
    const b = samples[Math.min(j + 1, samples.length - 1)] ?? a;
    out[i] = Math.round(a + (b - a) * frac);
  }
  return out;
}

export function convert(buf: Buffer, from: Format, to: Format): Buffer {
  if (from.codec === to.codec && from.rate === to.rate) return buf;
  return fromSamples(
    resample(toSamples(buf, from.codec), from.rate, to.rate),
    to.codec
  );
}

export const toInternal = (buf: Buffer, from: Format) =>
  convert(buf, from, INTERNAL);
export const fromInternal = (buf: Buffer, to: Format) =>
  convert(buf, INTERNAL, to);

/** Root-mean-square level of an internal frame, 0 to 32768. */
export function rms(frame: Buffer): number {
  const n = Math.floor(frame.length / 2);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const s = frame.readInt16LE(i * 2);
    sum += s * s;
  }
  return Math.sqrt(sum / n);
}

export const SILENT_FRAME = Buffer.alloc(FRAME_BYTES);

/** Splits internal audio into 20 ms frames, padding the last one with silence. */
export function toFrames(buf: Buffer): Buffer[] {
  const out: Buffer[] = [];
  for (let i = 0; i < buf.length; i += FRAME_BYTES) {
    const frame = buf.subarray(i, i + FRAME_BYTES);
    out.push(
      frame.length === FRAME_BYTES
        ? frame
        : Buffer.concat([frame, SILENT_FRAME.subarray(frame.length)])
    );
  }
  return out;
}

/** Reads a PCM WAV file (8/16-bit PCM or μ-law, any rate, mono or stereo) into internal audio. */
export function decodeWav(buf: Buffer): Buffer {
  if (
    buf.toString("ascii", 0, 4) !== "RIFF" ||
    buf.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("not a WAV file");
  }
  let offset = 12;
  let fmt:
    | { format: number; channels: number; rate: number; bits: number }
    | undefined;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ") {
      fmt = {
        format: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        rate: buf.readUInt32LE(body + 4),
        bits: buf.readUInt16LE(body + 14)
      };
    } else if (id === "data") {
      if (!fmt) throw new Error("WAV data before fmt");
      const data = buf.subarray(body, Math.min(body + size, buf.length));
      let samples: Int16Array;
      if (fmt.format === 7) samples = toSamples(data, "pcmu");
      else if (fmt.format === 1 && fmt.bits === 16)
        samples = toSamples(data, "pcm16");
      else if (fmt.format === 1 && fmt.bits === 8)
        samples = Int16Array.from(data, (b) => (b - 128) << 8);
      else
        throw new Error(`unsupported WAV encoding ${fmt.format}/${fmt.bits}`);
      if (fmt.channels === 2) samples = samples.filter((_, i) => i % 2 === 0);
      return fromSamples(resample(samples, fmt.rate, INTERNAL_RATE), "pcm16");
    }
    offset = body + size + (size % 2);
  }
  throw new Error("WAV has no data chunk");
}
