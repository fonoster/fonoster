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

// Real RTP for the Roomr suite (redesign-roomr 11.7, 11.3): the app leg of the fake session
// endpoint and the RTP participants and listeners the harness adds are UDP sockets that send
// L16/16000 frames (payload type 96, 20 ms, big-endian samples) at real-time pace and keep what
// they hear with arrival times, so scenarios can assert audio and the mix-minus checker can tell
// tones apart.

export const RATE = 16000;
export const FRAME_MS = 20;
export const FRAME_SAMPLES = (RATE / 1000) * FRAME_MS;
export const L16 = "L16/16000";
export const L16_PAYLOAD_TYPE = 96;
/** RMS above which a frame counts as audible (as the caller bot counts). */
export const AUDIBLE_RMS = 300;

export type HeardFrame = { at: number; samples: Int16Array; audible: boolean };

export type RtpEndpoint = { ip: string; port: number; codec?: string };

/** One 20 ms frame of a sine at `hz` (amplitude 8000), continuing phase from `index`. */
export function toneFrame(hz: number, index: number): Int16Array {
  const out = new Int16Array(FRAME_SAMPLES);
  for (let j = 0; j < FRAME_SAMPLES; j++) {
    const n = index * FRAME_SAMPLES + j;
    out[j] = Math.round(8000 * Math.sin((2 * Math.PI * hz * n) / RATE));
  }
  return out;
}

export function rms(samples: Int16Array): number {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return samples.length ? Math.sqrt(sum / samples.length) : 0;
}

/** L16 payload: big-endian 16-bit samples. */
export function l16Payload(samples: Int16Array): Buffer {
  const buf = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) buf.writeInt16BE(samples[i], i * 2);
  return buf;
}

export function l16Samples(payload: Buffer): Int16Array {
  const out = new Int16Array(Math.floor(payload.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = payload.readInt16BE(i * 2);
  return out;
}

/** The payload of an RTP packet (header, CSRCs and extension skipped), or undefined. */
export function rtpPayload(msg: Buffer): Buffer | undefined {
  if (msg.length < 12 || msg[0] >> 6 !== 2) return undefined;
  let offset = 12 + (msg[0] & 0x0f) * 4;
  if (msg[0] & 0x10) offset += 4 + msg.readUInt16BE(offset + 2) * 4;
  return offset <= msg.length ? msg.subarray(offset) : undefined;
}

export function rtpPacket(
  seq: number,
  timestamp: number,
  ssrc: number,
  payload: Buffer,
  payloadType = L16_PAYLOAD_TYPE
): Buffer {
  const packet = Buffer.alloc(12 + payload.length);
  packet[0] = 0x80;
  packet[1] = payloadType & 0x7f;
  packet.writeUInt16BE(seq & 0xffff, 2);
  packet.writeUInt32BE(timestamp >>> 0, 4);
  packet.writeUInt32BE(ssrc >>> 0, 8);
  payload.copy(packet, 12);
  return packet;
}

/** What a party sends each tick: a tone, silence, or nothing at all (muted). */
type Source = { hz?: number; until: number; index: number };

/**
 * One RTP party on a UDP socket: it sends a frame every 20 ms to its remote (a tone while one is
 * queued, else silence; nothing when muted) and keeps every frame it hears.
 */
export class RtpParty {
  readonly heard: HeardFrame[] = [];
  remote?: { ip: string; port: number };
  muted = false;
  private socket = dgram.createSocket("udp4");
  private source?: Source;
  private timer?: ReturnType<typeof setTimeout>;
  private seq = Math.floor(Math.random() * 0xffff);
  private timestamp = Math.floor(Math.random() * 0xffffffff);
  private readonly ssrc = Math.floor(Math.random() * 0xffffffff);
  private closed = false;
  port = 0;

  constructor(readonly host = "127.0.0.1") {
    this.socket.on("error", () => undefined);
    this.socket.on("message", (msg) => {
      const payload = rtpPayload(msg);
      if (!payload) return;
      const samples = l16Samples(payload);
      this.heard.push({
        at: Date.now(),
        samples,
        audible: rms(samples) > AUDIBLE_RMS
      });
    });
  }

  async bind(): Promise<this> {
    await new Promise<void>((resolve) =>
      this.socket.bind(0, this.host, () => resolve())
    );
    this.port = this.socket.address().port;
    return this;
  }

  /** This party's endpoint, as a MediaEndpoint for Roomr and the control stream. */
  endpoint(): RtpEndpoint {
    return { ip: this.host, port: this.port, codec: L16 };
  }

  /** Starts sending to `remote` every 20 ms (silence until a tone is queued). */
  start(remote: { ip: string; port: number }) {
    this.remote = { ip: remote.ip, port: remote.port };
    if (this.timer || this.closed) return;
    const begin = Date.now();
    let i = 0;
    const tick = () => {
      if (this.closed) return;
      this.sendFrame();
      i++;
      this.timer = setTimeout(
        tick,
        Math.max(0, begin + i * FRAME_MS - Date.now())
      );
    };
    tick();
  }

  /** Sends a tone at `hz` (silence when hz is 0) for `ms`, from the next frame. */
  play(hz: number, ms: number) {
    this.source = { hz, until: Date.now() + ms, index: 0 };
  }

  private sendFrame() {
    if (!this.remote || this.muted) return;
    const s = this.source;
    let samples: Int16Array = new Int16Array(FRAME_SAMPLES);
    if (s && Date.now() < s.until) {
      if (s.hz) samples = toneFrame(s.hz, s.index);
      s.index++;
    }
    const packet = rtpPacket(
      this.seq,
      this.timestamp,
      this.ssrc,
      l16Payload(samples)
    );
    this.seq = (this.seq + 1) & 0xffff;
    this.timestamp = (this.timestamp + FRAME_SAMPLES) >>> 0;
    this.socket.send(packet, this.remote.port, this.remote.ip);
  }

  /** ms of audible audio heard at or after `since`. */
  audibleMsSince(since: number): number {
    return (
      this.heard.filter((f) => f.at >= since && f.audible).length * FRAME_MS
    );
  }

  /** Every sample heard in [since, until]. */
  pcmBetween(since: number, until = Date.now()): Int16Array {
    const frames = this.heard.filter((f) => f.at >= since && f.at <= until);
    const out = new Int16Array(frames.length * FRAME_SAMPLES);
    frames.forEach((f, i) =>
      out.set(f.samples.subarray(0, FRAME_SAMPLES), i * FRAME_SAMPLES)
    );
    return out;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.timer);
    try {
      this.socket.close();
    } catch {
      // already closed
    }
  }
}

/** A mono 16-bit 16 kHz WAV of a tone, for hold music. */
export function toneWav(hz: number, ms: number): Buffer {
  const frames = Math.round(ms / FRAME_MS);
  const pcm = Buffer.alloc(frames * FRAME_SAMPLES * 2);
  for (let i = 0; i < frames; i++) {
    const f = toneFrame(hz, i);
    for (let j = 0; j < f.length; j++)
      pcm.writeInt16LE(f[j], (i * FRAME_SAMPLES + j) * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Mono 16-bit PCM samples of a WAV at 8 or 16 kHz, upsampled to 16 kHz; undefined if not one. */
export function wavSamples(data: Buffer): Int16Array | undefined {
  if (data.length < 44 || data.toString("ascii", 0, 4) !== "RIFF")
    return undefined;
  let rate = 0;
  let bits = 0;
  let channels = 0;
  let pcm: Buffer | undefined;
  for (let off = 12; off + 8 <= data.length;) {
    const id = data.toString("ascii", off, off + 4);
    const size = data.readUInt32LE(off + 4);
    const body = data.subarray(off + 8, Math.min(data.length, off + 8 + size));
    if (id === "fmt " && body.length >= 16) {
      channels = body.readUInt16LE(2);
      rate = body.readUInt32LE(4);
      bits = body.readUInt16LE(14);
    } else if (id === "data") pcm = body;
    off += 8 + size + (size % 2);
  }
  if (
    !pcm ||
    bits !== 16 ||
    channels !== 1 ||
    (rate !== 8000 && rate !== 16000)
  )
    return undefined;
  const n = Math.floor(pcm.length / 2);
  const out = new Int16Array(rate === 8000 ? n * 2 : n);
  for (let i = 0; i < n; i++) {
    const s = pcm.readInt16LE(i * 2);
    if (rate === 8000) out[i * 2] = out[i * 2 + 1] = s;
    else out[i] = s;
  }
  return out;
}
