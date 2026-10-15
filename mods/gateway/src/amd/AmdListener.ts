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

const logger = getLogger({ service: "gateway", filePath: __filename });

// Answering-machine detection as a voice-worker listener (add-media-node 4.3, design: "AMD via
// AMD() or the ML sidecar over AGI/AudioSocket → a listener in the voice worker"). The gateway
// attaches a listen-only participant to the room with one RTP stream: the caller's track. It
// collects the first `windowMs` of the caller's audio (16 kHz L16, the recording format), asks the
// classifier, detaches, and reports `amd.result` to the session and the call record.

export const AMD_RATE = 16000;
export const AMD_CODEC = "L16/16000";
const DEFAULT_WINDOW_MS = 4000;
/** Extra time to wait for audio after the window, then classify what arrived. */
const GRACE_MS = 1500;
/** Below this much audio the verdict is `unknown` without asking the classifier. */
const MIN_AUDIO_MS = 300;

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
  /** Set when the detection could not run; the status is then `unknown`. */
  reason?: string;
};

/** One AMD run on one call. */
export class AmdListener {
  private socket?: dgram.Socket;
  private chunks: Buffer[] = [];
  private bytes = 0;
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
        if (reason || audioMs < MIN_AUDIO_MS) {
          return resolve({
            status: "unknown",
            confidence: 0,
            detector: "none",
            audioMs,
            reason: reason ?? "no_audio"
          });
        }
        try {
          resolve({ ...(await this.classify(pcm)), audioMs });
        } catch (e) {
          logger.warn(
            `call ${this.host.callRef}: amd classifier failed: ${(e as Error).message}`
          );
          resolve({
            status: "unknown",
            confidence: 0,
            detector: "none",
            audioMs,
            reason: "classifier_failed"
          });
        }
      };
      this.onEnough = () => void finish();
      this.stopNow = (reason) => void finish(reason);
      this.need = need;
      this.timer = setTimeout(() => void finish(), windowMs + GRACE_MS);
      void this.attach(callerTrack).catch((e: Error & { code?: string }) =>
        finish(e.code ?? "attach_failed")
      );
    });
  }

  private need = 0;
  private onEnough: () => void = () => undefined;
  private stopNow: (reason: string) => void = () => undefined;

  /** Ends the run early (the call ended); the verdict is `unknown` unless enough audio arrived. */
  stop() {
    if (this.bytes >= this.need) this.onEnough();
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
    this.chunks.push(le);
    this.bytes += le.length;
    if (this.bytes >= this.need) this.onEnough();
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
 * dependency of the gateway (and its image, model included; AO-B2).
 */
export function loadAmdClassifier(modelDir?: string): AmdClassifier {
  let classify:
    | ((pcm: Buffer, dir?: string) => Promise<AmdVerdict>)
    | undefined;
  return async (pcm) => {
    if (!classify) {
      // The model module only (not the AGI/AudioSocket servers in the package index).
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
