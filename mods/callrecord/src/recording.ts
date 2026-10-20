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
import { createHash } from "crypto";
import * as dgram from "dgram";
import * as fs from "fs";
import * as path from "path";

// Full-call recording (call-record "Recording is applied by policy", design V8): an internal
// listener attached with media-control `listener.attach`, one unmixed RTP stream per side. The
// recorder writes each side as raw 16 kHz PCM next to the working record, so an AppBridge crash
// keeps what was recorded; sealing turns the two sides into one stereo WAV (left: caller,
// right: agent) and references it, with its hash, from the vCon dialog.

export const RECORDING_RATE = 16000;
export const RECORDING_CODEC = "L16/16000";
export const RECORDING_PART = "recording.wav";
/** The recording with redacted spans beeped, referenced by the redacted copy (LO-B9). */
export const REDACTED_RECORDING_PART = "recording.redacted.wav";
export const RECORDING_SIDES = ["caller", "agent"] as const;
export type RecordingSide = (typeof RECORDING_SIDES)[number];

/** Gaps longer than this are not filled with silence (a clock jump, not a pause). */
const MAX_GAP_SAMPLES = RECORDING_RATE * 60;

export type RecordingMeta = {
  startedAt: number;
  rate: number;
  sides: RecordingSide[];
};

class Track {
  private fd: number;
  private written = 0;
  private firstTs?: number;
  private firstOffset = 0;

  constructor(
    file: string,
    private readonly startedAt: number
  ) {
    this.fd = fs.openSync(file, "a");
  }

  /** Places a packet by its RTP timestamp; silence fills gaps, late packets are dropped. */
  packet(msg: Buffer, now = Date.now()) {
    if (msg.length < 12 || msg[0] >> 6 !== 2) return;
    let offset = 12 + (msg[0] & 0x0f) * 4;
    if (msg[0] & 0x10) offset += 4 + msg.readUInt16BE(offset + 2) * 4;
    const ts = msg.readUInt32BE(4);
    const payload = msg.subarray(offset);
    if (this.firstTs === undefined) {
      this.firstTs = ts;
      this.firstOffset = Math.max(
        0,
        Math.round(((now - this.startedAt) * RECORDING_RATE) / 1000)
      );
    }
    const position =
      this.firstOffset + ((ts - this.firstTs + 0x100000000) % 0x100000000);
    if (position < this.written) return;
    const gap = position - this.written;
    if (gap > 0 && gap <= MAX_GAP_SAMPLES) this.write(Buffer.alloc(gap * 2));
    // L16 on the wire is big-endian; the WAV is little-endian.
    const le = Buffer.alloc(payload.length - (payload.length % 2));
    for (let i = 0; i < le.length; i += 2)
      le.writeInt16LE(payload.readInt16BE(i), i);
    this.write(le);
  }

  private write(data: Buffer) {
    fs.writeSync(this.fd, data);
    this.written += data.length / 2;
  }

  close() {
    try {
      fs.fsyncSync(this.fd);
      fs.closeSync(this.fd);
    } catch {
      // already closed
    }
  }
}

/** The rtp block a listener.attach track points at. */
export type RecorderRtp = { host: string; port: number; codec: string };

/**
 * Receives one RTP stream per side and appends it to `<dir>/<side>.pcm`. Bind it, send
 * `listener.attach` with `rtpFor(side)`, and stop it before the record is sealed.
 */
export class Recorder {
  private sockets = new Map<RecordingSide, dgram.Socket>();
  private tracks = new Map<RecordingSide, Track>();
  private stopped = false;
  readonly startedAt = Date.now();

  constructor(private readonly dir: string) {}

  async bind(host = "127.0.0.1", advertiseHost?: string) {
    fs.mkdirSync(this.dir, { recursive: true });
    const meta: RecordingMeta = {
      startedAt: this.startedAt,
      rate: RECORDING_RATE,
      sides: [...RECORDING_SIDES]
    };
    fs.writeFileSync(path.join(this.dir, "meta.json"), JSON.stringify(meta));
    const rtp: Partial<Record<RecordingSide, RecorderRtp>> = {};
    for (const side of RECORDING_SIDES) {
      const track = new Track(
        path.join(this.dir, `${side}.pcm`),
        this.startedAt
      );
      const socket = dgram.createSocket("udp4");
      socket.on("message", (msg) => !this.stopped && track.packet(msg));
      socket.on("error", () => undefined);
      await new Promise<void>((resolve) => socket.bind(0, host, resolve));
      this.sockets.set(side, socket);
      this.tracks.set(side, track);
      rtp[side] = {
        host: advertiseHost ?? host,
        port: socket.address().port,
        codec: RECORDING_CODEC
      };
    }
    return rtp as Record<RecordingSide, RecorderRtp>;
  }

  /** Closes the sockets and flushes both sides to disk. Safe to call twice. */
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    for (const s of this.sockets.values()) {
      try {
        s.close();
      } catch {
        // already closed
      }
    }
    for (const t of this.tracks.values()) t.close();
  }
}

export function wavHeader(
  dataBytes: number,
  channels: number,
  rate = RECORDING_RATE
) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + dataBytes, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * channels * 2, 28);
  h.writeUInt16LE(channels * 2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(dataBytes, 40);
  return h;
}

/**
 * Builds the stereo WAV (left: caller, right: agent) from a recorder's directory, or undefined
 * when nothing was recorded. Works on what a crashed AppBridge left behind as well.
 */
export function assembleRecording(
  dir: string
): { wav: Buffer; startedAt: number; durationMs: number } | undefined {
  const metaFile = path.join(dir, "meta.json");
  if (!fs.existsSync(metaFile)) return undefined;
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf8")) as RecordingMeta;
  const read = (side: RecordingSide) => {
    const f = path.join(dir, `${side}.pcm`);
    return fs.existsSync(f) ? fs.readFileSync(f) : Buffer.alloc(0);
  };
  const left = read("caller");
  const right = read("agent");
  const samples = Math.floor(Math.max(left.length, right.length) / 2);
  if (samples === 0) return undefined;
  const data = Buffer.alloc(samples * 4);
  for (let i = 0; i < samples; i++) {
    if (i * 2 + 1 < left.length)
      data.writeInt16LE(left.readInt16LE(i * 2), i * 4);
    if (i * 2 + 1 < right.length)
      data.writeInt16LE(right.readInt16LE(i * 2), i * 4 + 2);
  }
  return {
    wav: Buffer.concat([wavHeader(data.length, 2, meta.rate), data]),
    startedAt: meta.startedAt,
    durationMs: Math.round((samples * 1000) / meta.rate)
  };
}

/** Samples per side per chunk when streaming the WAV (64 Ki samples: 256 KiB of output). */
const CHUNK_SAMPLES = 65536;

/**
 * Like `assembleRecording`, but streams the stereo WAV to `outFile` chunk by chunk and hashes it
 * on the way, so a long recording never sits in memory (LO-B7). Returns the file part's facts.
 */
export function assembleRecordingFile(
  dir: string,
  outFile: string
):
  | {
      file: string;
      size: number;
      content_hash: string;
      startedAt: number;
      durationMs: number;
    }
  | undefined {
  const metaFile = path.join(dir, "meta.json");
  if (!fs.existsSync(metaFile)) return undefined;
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf8")) as RecordingMeta;
  const open = (side: RecordingSide) => {
    const f = path.join(dir, `${side}.pcm`);
    if (!fs.existsSync(f)) return { fd: -1, samples: 0 };
    return {
      fd: fs.openSync(f, "r"),
      samples: Math.floor(fs.statSync(f).size / 2)
    };
  };
  const left = open("caller");
  const right = open("agent");
  const samples = Math.max(left.samples, right.samples);
  const close = () =>
    [left.fd, right.fd]
      .filter((fd) => fd >= 0)
      .forEach((fd) => fs.closeSync(fd));
  if (samples === 0) {
    close();
    return undefined;
  }
  const hash = createHash("sha512");
  const out = fs.openSync(outFile, "w");
  const write = (b: Buffer) => {
    fs.writeSync(out, b);
    hash.update(b);
  };
  try {
    write(wavHeader(samples * 4, 2, meta.rate));
    const l = Buffer.alloc(CHUNK_SAMPLES * 2);
    const r = Buffer.alloc(CHUNK_SAMPLES * 2);
    for (let start = 0; start < samples; start += CHUNK_SAMPLES) {
      const n = Math.min(CHUNK_SAMPLES, samples - start);
      const read = (side: { fd: number; samples: number }, buf: Buffer) => {
        buf.fill(0, 0, n * 2);
        const want = Math.max(0, Math.min(n, side.samples - start));
        if (side.fd >= 0 && want > 0)
          fs.readSync(side.fd, buf, 0, want * 2, start * 2);
      };
      read(left, l);
      read(right, r);
      const data = Buffer.alloc(n * 4);
      for (let i = 0; i < n; i++) {
        data.writeInt16LE(l.readInt16LE(i * 2), i * 4);
        data.writeInt16LE(r.readInt16LE(i * 2), i * 4 + 2);
      }
      write(data);
    }
    fs.fsyncSync(out);
  } finally {
    fs.closeSync(out);
    close();
  }
  return {
    file: outFile,
    size: 44 + samples * 4,
    content_hash: `sha512-${hash.digest("base64url")}`,
    startedAt: meta.startedAt,
    durationMs: Math.round((samples * 1000) / meta.rate)
  };
}

/** A stretch of one side to beep, in ms from the start of the recording. */
export type BeepSpan = { side: RecordingSide; fromMs: number; toMs: number };

const BEEP_HZ = 1000;
const BEEP_AMPLITUDE = 6000;

/**
 * Copies a stereo recording (left caller, right agent) to `outFile` with every span replaced by
 * a 1 kHz tone on its side (redaction beeps, LO-B9), streaming and hashing like
 * `assembleRecordingFile`. The other side of a span is untouched.
 */
export function beepRecordingFile(
  source: string,
  outFile: string,
  spans: BeepSpan[]
): { file: string; size: number; content_hash: string } {
  const input = fs.openSync(source, "r");
  const out = fs.openSync(outFile, "w");
  const hash = createHash("sha512");
  const write = (b: Buffer) => {
    fs.writeSync(out, b);
    hash.update(b);
  };
  try {
    const header = Buffer.alloc(44);
    fs.readSync(input, header, 0, 44, 0);
    const channels = header.readUInt16LE(22);
    const rate = header.readUInt32LE(24);
    write(header);
    const frameBytes = channels * 2;
    const ranges = spans.map((s) => ({
      channel: s.side === "caller" ? 0 : 1,
      from: Math.max(0, Math.floor((s.fromMs * rate) / 1000)),
      to: Math.ceil((s.toMs * rate) / 1000)
    }));
    const size = fs.fstatSync(input).size;
    const chunk = Buffer.alloc(CHUNK_SAMPLES * frameBytes);
    let frame = 0;
    for (let pos = 44; pos < size;) {
      const n = fs.readSync(input, chunk, 0, chunk.length, pos);
      if (n <= 0) break;
      const data = chunk.subarray(0, n);
      const frames = Math.floor(n / frameBytes);
      for (const r of ranges) {
        if (r.channel >= channels) continue;
        const a = Math.max(r.from, frame);
        const b = Math.min(r.to, frame + frames);
        for (let i = a; i < b; i++)
          data.writeInt16LE(
            Math.round(
              BEEP_AMPLITUDE * Math.sin((2 * Math.PI * BEEP_HZ * i) / rate)
            ),
            (i - frame) * frameBytes + r.channel * 2
          );
      }
      write(data);
      frame += frames;
      pos += n;
    }
    fs.fsyncSync(out);
    return {
      file: outFile,
      size,
      content_hash: `sha512-${hash.digest("base64url")}`
    };
  } finally {
    fs.closeSync(input);
    fs.closeSync(out);
  }
}

/** Splits a stereo 16-bit WAV into its channels (for tests and tools). */
export function wavChannels(wav: Buffer): Int16Array[] {
  const channels = wav.readUInt16LE(22);
  const data = wav.subarray(44);
  const frames = Math.floor(data.length / (2 * channels));
  const out = Array.from({ length: channels }, () => new Int16Array(frames));
  for (let i = 0; i < frames; i++)
    for (let c = 0; c < channels; c++)
      out[c][i] = data.readInt16LE((i * channels + c) * 2);
  return out;
}
