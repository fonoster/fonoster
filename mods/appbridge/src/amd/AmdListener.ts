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
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "appbridge", filePath: __filename });

// Answering-machine detection as a voice-worker listener (add-roomr 4.3, design: "AMD via
// AMD() or the ML sidecar over AGI/AudioSocket → a listener in the voice worker"). AppBridge
// attaches a listen-only participant to the room with one RTP stream: the caller's track. It
// collects `windowMs` of the caller's audio (16 kHz L16, the recording format) from the moment the
// caller starts speaking, asks the classifier, detaches, and reports `amd.result` to the session and
// the call record. Carriers can send seconds of silence after answer before a voicemail greeting
// starts; the model reads that silence as a confident human, so it is measured, not classified.

export const AMD_RATE = 16000;
export const AMD_CODEC = "L16/16000";
const DEFAULT_WINDOW_MS = 4000;
/** Extra time to wait for audio after the window, then classify what arrived. */
const GRACE_MS = 1500;
/** Below this much audio the verdict is `unknown` without asking the classifier. */
const MIN_AUDIO_MS = 300;
/** One 20 ms frame of 16 kHz L16. */
const FRAME_BYTES = (AMD_RATE * 2 * 20) / 1000;
/** Mean absolute sample value (0-32767) a frame must reach to count as speech. */
const SPEECH_LEVEL = 256;
/** Consecutive loud frames that start the window, so a click or line pop doesn't. */
const ONSET_FRAMES = 3;
/** How long to wait for the caller to start speaking; then the verdict is `no_speech`. */
const SPEECH_WAIT_MS = 4000;

function frameLevel(pcm: Buffer, offset: number): number {
  let sum = 0;
  for (let i = 0; i < FRAME_BYTES; i += 2)
    sum += Math.abs(pcm.readInt16LE(offset + i));
  return sum / (FRAME_BYTES / 2);
}

export type AmdVerdict = {
  status: "human" | "voicemail" | "ivr" | "machine" | "unknown";
  confidence: number;
  detector: string;
};

/** Classifies 16 kHz mono 16-bit little-endian PCM (mods/amd's `classifyPcm`). */
export type AmdClassifier = (pcm: Buffer) => Promise<AmdVerdict>;

export type AmdAppOption = boolean | { enabled?: boolean; windowMs?: number };

export function amdWindowMs(option?: AmdAppOption): number | undefined {
  if (option === true) return DEFAULT_WINDOW_MS;
  if (option && typeof option === "object" && option.enabled !== false)
    return Math.min(Math.max(option.windowMs ?? DEFAULT_WINDOW_MS, 500), 15000);
  return undefined;
}

type Host = {
  callRef: string;
  mediaCommand(command: {
    type: string;
    [k: string]: unknown;
  }): Promise<Record<string, unknown>>;
};

export type AmdResult = AmdVerdict & {
  /** How much caller audio the verdict is based on. */
  audioMs: number;
  /** Caller audio received before speech began; unset when the caller never spoke. */
  speechOnsetMs?: number;
  /** Set when the detection could not run; the status is then `unknown`. */
  reason?: string;
};

/** One AMD run on one call. */
export class AmdListener {
  private socket?: dgram.Socket;
  private chunks: Buffer[] = [];
  private bytes = 0;
  private received = 0;
  /** Before onset: the current run of loud frames, and how many bytes came before it. */
  private pending: Buffer = Buffer.alloc(0);
  private beforeOnset = 0;
  private loudFrames = 0;
  private onsetMs?: number;
  private done = false;
  private timer?: ReturnType<typeof setTimeout>;
  private listenerRef?: string;

  constructor(
    private readonly host: Host,
    private readonly classify: AmdClassifier,
    private readonly rtp: { host?: string; advertiseHost?: string } = {}
  ) {}

  /** Attaches to the caller's track and resolves with the verdict (never rejects). */
  run(callerTrack: number, windowMs: number): Promise<AmdResult> {
    return new Promise<AmdResult>((resolve) => {
      const need = (AMD_RATE * 2 * windowMs) / 1000;
      const finish = async (reason?: string) => {
        if (this.done) return;
        this.done = true;
        clearTimeout(this.timer);
        this.close();
        await this.detach();
        const pcm = Buffer.concat(this.chunks).subarray(0, need);
        const audioMs = Math.round((pcm.length / 2 / AMD_RATE) * 1000);
        const onset =
          this.onsetMs === undefined ? {} : { speechOnsetMs: this.onsetMs };
        if (!reason && this.onsetMs === undefined)
          reason = this.received ? "no_speech" : "no_audio";
        if (reason || audioMs < MIN_AUDIO_MS) {
          return resolve({
            status: "unknown",
            confidence: 0,
            detector: "none",
            audioMs,
            ...onset,
            reason: reason ?? "no_audio"
          });
        }
        try {
          resolve({ ...(await this.classify(pcm)), audioMs, ...onset });
        } catch (e) {
          logger.warn(
            `call ${this.host.callRef}: amd classifier failed: ${(e as Error).message}`
          );
          resolve({
            status: "unknown",
            confidence: 0,
            detector: "none",
            audioMs,
            ...onset,
            reason: "classifier_failed"
          });
        }
      };
      this.onEnough = () => void finish();
      this.stopNow = (reason) => void finish(reason);
      this.onSpeech = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => void finish(), windowMs + GRACE_MS);
      };
      this.need = need;
      this.timer = setTimeout(() => void finish(), SPEECH_WAIT_MS);
      void this.attach(callerTrack).catch((e: Error & { code?: string }) =>
        finish(e.code ?? "attach_failed")
      );
    });
  }

  private need = 0;
  private onEnough: () => void = () => undefined;
  private onSpeech: () => void = () => undefined;
  private stopNow: (reason: string) => void = () => undefined;

  /** Ends the run early (the call ended); the verdict is `unknown` unless enough audio arrived. */
  stop() {
    if (this.onsetMs !== undefined && this.bytes >= this.need) this.onEnough();
    else this.stopNow("call_ended");
  }

  private async attach(callerTrack: number) {
    const socket = dgram.createSocket("udp4");
    this.socket = socket;
    socket.on("message", (msg) => this.packet(msg));
    socket.on("error", () => undefined);
    const bindHost = this.rtp.host ?? "127.0.0.1";
    await new Promise<void>((resolve) => socket.bind(0, bindHost, resolve));
    if (this.done) return this.close();
    const ack = await this.host.mediaCommand({
      type: "listener.attach",
      tracks: [
        {
          trackId: callerTrack,
          rtp: {
            host: this.rtp.advertiseHost ?? bindHost,
            port: socket.address().port,
            codec: AMD_CODEC
          }
        }
      ]
    });
    this.listenerRef = ack.listenerRef as string | undefined;
    if (this.done) await this.detach();
  }

  /** L16 RTP payloads (big-endian on the wire) appended as little-endian PCM. */
  private packet(msg: Buffer) {
    if (this.done || msg.length < 12 || msg[0] >> 6 !== 2) return;
    let offset = 12 + (msg[0] & 0x0f) * 4;
    if (msg[0] & 0x10) offset += 4 + msg.readUInt16BE(offset + 2) * 4;
    const payload = msg.subarray(offset);
    const le = Buffer.alloc(payload.length - (payload.length % 2));
    for (let i = 0; i < le.length; i += 2)
      le.writeInt16LE(payload.readInt16BE(i), i);
    this.received += le.length;
    if (this.onsetMs === undefined) this.scanForOnset(le);
    else this.append(le);
  }

  private append(pcm: Buffer) {
    this.chunks.push(pcm);
    this.bytes += pcm.length;
    if (this.bytes >= this.need) this.onEnough();
  }

  /** Drops quiet frames until ONSET_FRAMES loud ones in a row; the window starts at the first. */
  private scanForOnset(pcm: Buffer) {
    this.pending = this.pending.length
      ? Buffer.concat([this.pending, pcm])
      : pcm;
    let offset = this.loudFrames * FRAME_BYTES;
    while (this.pending.length - offset >= FRAME_BYTES) {
      if (frameLevel(this.pending, offset) < SPEECH_LEVEL) {
        const drop = offset + FRAME_BYTES;
        this.beforeOnset += drop;
        this.pending = this.pending.subarray(drop);
        this.loudFrames = 0;
        offset = 0;
        continue;
      }
      this.loudFrames++;
      offset += FRAME_BYTES;
      if (this.loudFrames === ONSET_FRAMES) {
        const speech = this.pending;
        this.pending = Buffer.alloc(0);
        this.onsetMs = Math.round((this.beforeOnset / 2 / AMD_RATE) * 1000);
        this.onSpeech();
        this.append(speech);
        return;
      }
    }
  }

  private async detach() {
    const listenerRef = this.listenerRef;
    this.listenerRef = undefined;
    if (!listenerRef) return;
    await this.host
      .mediaCommand({ type: "listener.detach", listenerRef })
      .catch(() => undefined);
  }

  private close() {
    try {
      this.socket?.close();
    } catch {
      // already closed
    }
    this.socket = undefined;
  }
}

/**
 * The production classifier: mods/amd's ONNX model, loaded on first use. `@fonoster/amd` is a
 * dependency of AppBridge (and its image, model included; AO-B2).
 */
export function loadAmdClassifier(modelDir?: string): AmdClassifier {
  let classify:
    | ((pcm: Buffer, dir?: string) => Promise<AmdVerdict>)
    | undefined;
  return async (pcm) => {
    if (!classify) {
      // Loaded lazily: onnxruntime is heavy and only AMD calls need it.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const amd = require("@fonoster/amd/dist/amd/AmdModel") as {
        classifyPcm: (pcm: Buffer, dir?: string) => Promise<AmdVerdict>;
      };
      classify = amd.classifyPcm;
    }
    const verdict = await classify(pcm, modelDir);
    return {
      status: String(verdict.status).toLowerCase() as AmdVerdict["status"],
      confidence: verdict.confidence,
      detector: verdict.detector
    };
  };
}
