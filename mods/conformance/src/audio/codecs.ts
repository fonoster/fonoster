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
// Minimal audio helpers for fakes and runners: enough to generate, encode and measure frames.
// No resampling: fakes produce audio at the rate they are asked for.

export const FRAME_MS = 20;

export type AudioFormat = {
  /** "pcm16" (little-endian, the session's PCM), "l16" (big-endian, RTP L16) or "pcmu". */
  codec: "pcm16" | "l16" | "pcmu";
  rate: number;
};

const CODEC_ALIASES: Record<string, AudioFormat["codec"]> = {
  pcm16: "pcm16",
  linear16: "pcm16",
  pcm16le: "pcm16",
  l16: "l16",
  pcmu: "pcmu",
  mulaw: "pcmu",
  ulaw: "pcmu",
  "audio/x-mulaw": "pcmu"
};

/** Parses session and RTP codec names: "pcm16", "PCMU/8000", "L16/16000", "audio/x-mulaw". */
export function parseFormat(codec: string, rate?: number): AudioFormat {
  const [name, rateText] =
    codec.split("/").length === 2 && !codec.startsWith("audio/")
      ? codec.split("/")
      : [codec, undefined];
  const normalized = CODEC_ALIASES[name.toLowerCase()];
  if (!normalized) throw new Error(`unsupported codec: ${codec}`);
  const r =
    rate ??
    (rateText ? Number(rateText) : normalized === "pcmu" ? 8000 : 16000);
  return { codec: normalized, rate: r };
}

export function bytesPerSample(format: AudioFormat): number {
  return format.codec === "pcmu" ? 1 : 2;
}

export function bytesPerMs(format: AudioFormat): number {
  return (format.rate / 1000) * bytesPerSample(format);
}

export function durationMs(bytes: number, format: AudioFormat): number {
  return bytes / bytesPerMs(format);
}

// G.711 μ-law, after the reference implementation.
const BIAS = 0x84;
const CLIP = 32635;

export function linearToMulaw(sample: number): number {
  const sign = sample < 0 ? 0x80 : 0;
  let s = Math.min(Math.abs(sample), CLIP) + BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (s & mask) === 0 && exponent > 0; mask >>= 1)
    exponent--;
  const mantissa = (s >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

export function mulawToLinear(byte: number): number {
  const u = ~byte & 0xff;
  const sign = u & 0x80;
  const exponent = (u >> 4) & 0x07;
  const mantissa = u & 0x0f;
  const magnitude = (((mantissa << 3) + BIAS) << exponent) - BIAS;
  return sign ? -magnitude : magnitude;
}

/** Encodes 16-bit samples into the given format. */
export function encode(samples: Int16Array, format: AudioFormat): Buffer {
  if (format.codec === "pcmu") {
    return Buffer.from(Array.from(samples, linearToMulaw));
  }
  const out = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    format.codec === "l16"
      ? out.writeInt16BE(s, i * 2)
      : out.writeInt16LE(s, i * 2)
  );
  return out;
}

/** Decodes a buffer in the given format into 16-bit samples. */
export function decode(buf: Buffer, format: AudioFormat): Int16Array {
  if (format.codec === "pcmu") {
    return Int16Array.from(buf, mulawToLinear);
  }
  const out = new Int16Array(Math.floor(buf.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] =
      format.codec === "l16" ? buf.readInt16BE(i * 2) : buf.readInt16LE(i * 2);
  }
  return out;
}

/** A deterministic tone (440 Hz) or silence, as 16-bit samples. */
export function generate(
  kind: "tone" | "silence",
  ms: number,
  rate: number
): Int16Array {
  const n = Math.round((rate * ms) / 1000);
  const samples = new Int16Array(n);
  if (kind === "tone") {
    for (let i = 0; i < n; i++) {
      samples[i] = Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / rate));
    }
  }
  return samples;
}

/** True when the frame carries sound (any sample above a small threshold). */
export function isAudible(
  buf: Buffer,
  format: AudioFormat,
  threshold = 64
): boolean {
  const samples = decode(buf, format);
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > threshold) return true;
  }
  return false;
}

/** Splits encoded audio into frames of FRAME_MS (the last one may be shorter). */
export function frames(
  buf: Buffer,
  format: AudioFormat,
  frameMs = FRAME_MS
): Buffer[] {
  const size = Math.round(bytesPerMs(format) * frameMs);
  const out: Buffer[] = [];
  for (let i = 0; i < buf.length; i += size)
    out.push(buf.subarray(i, i + size));
  return out;
}

/** Reads raw PCM16LE mono audio and converts it to the given format (no resampling). */
export function fromPcm16le(buf: Buffer, format: AudioFormat): Buffer {
  return encode(decode(buf, { codec: "pcm16", rate: format.rate }), format);
}
