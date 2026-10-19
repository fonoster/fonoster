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
import * as http from "http";
import { AddressInfo } from "net";
import WebSocket from "ws";
import { FRAME_BYTES, FRAME_MS } from "../audio/pcm";
import { Transcript } from "../speech/types";
import { Detector, Estimate, SpeechKind } from "./Detector";

// Out-of-process Detectors (add-turn-taking task 2.7, open question 4 → TT-B8): a local WebSocket
// carrying the Detector interface, protocol `fonoster.detector.v1` (contract:
// mods/conformance/schema/detector.v1.schema.json). Any language can host a Detector behind it.
//
//   appbridge → detector  text   {type: "hello", protocol, rate: 16000, frameMs: 20}
//                       binary one 20 ms frame of caller audio, PCM16LE mono 16 kHz (640 bytes)
//                       text   {type: "transcript", text, final, language, confidence, turn?}
//                       text   {type: "output", playing}
//                       text   {type: "patience", factor}
//                       text   {type: "reset"}
//   detector → appbridge  text   {type: "estimate", frame, eot, speaking, kind}
//
// `frame` counts binary frames from 1, so the detector's clock is frame × 20 ms. AppBridge uses
// the latest estimate while it is at most `maxLagMs` behind; otherwise (not connected yet, slow,
// or gone) it uses its local fallback Detector, so a broken detector never stalls a call.

export const DETECTOR_PROTOCOL = "fonoster.detector.v1";
/** Estimates older than this (in audio time) are stale; the fallback answers instead. */
export const REMOTE_MAX_LAG_MS = 200;

const KINDS: SpeechKind[] = ["speech", "backchannel", "interruption", "none"];

export type RemoteDetectorOptions = {
  url: string;
  /** Answers while the remote Detector is unavailable or late (usually the baseline). */
  fallback: Detector;
  maxLagMs?: number;
  /** Called when the answering side changes, for the call record. */
  onSource?: (source: "remote" | "fallback", reason?: string) => void;
};

export class RemoteDetector implements Detector {
  private socket: WebSocket;
  private sent = 0;
  private latest?: { frame: number } & Estimate;
  private source?: "remote" | "fallback";
  private closed = false;

  constructor(private readonly options: RemoteDetectorOptions) {
    this.socket = new WebSocket(options.url);
    this.socket.on("open", () =>
      this.socket.send(
        JSON.stringify({
          type: "hello",
          protocol: DETECTOR_PROTOCOL,
          rate: 16000,
          frameMs: FRAME_MS
        })
      )
    );
    this.socket.on("message", (raw, isBinary) => {
      if (isBinary) return;
      try {
        const m = JSON.parse(raw.toString());
        if (
          m.type === "estimate" &&
          typeof m.frame === "number" &&
          typeof m.eot === "number" &&
          KINDS.includes(m.kind)
        )
          this.latest = {
            frame: m.frame,
            eot: Math.max(0, Math.min(1, m.eot)),
            speaking: m.speaking === true,
            kind: m.kind
          };
      } catch {
        // A malformed message is ignored; the fallback covers the gap.
      }
    });
    this.socket.on("error", () => undefined);
    this.socket.on("close", () => {
      this.latest = undefined;
    });
  }

  onAudio(frame: Buffer, at: number): Estimate {
    const local = this.options.fallback.onAudio(frame, at);
    this.sent++;
    this.send(frame);
    const maxLagFrames =
      (this.options.maxLagMs ?? REMOTE_MAX_LAG_MS) / FRAME_MS;
    const fresh =
      this.latest !== undefined &&
      this.sent - this.latest.frame <= maxLagFrames;
    this.use(
      fresh ? "remote" : "fallback",
      fresh
        ? undefined
        : this.socket.readyState === WebSocket.OPEN
          ? "late"
          : "unavailable"
    );
    if (!fresh) return local;
    const { eot, speaking, kind } = this.latest!;
    return { eot, speaking, kind };
  }

  onTranscript(t: Transcript, at: number) {
    this.options.fallback.onTranscript(t, at);
    this.send(
      JSON.stringify({
        type: "transcript",
        text: t.text,
        final: t.final,
        language: t.language,
        confidence: t.confidence,
        ...(t.turn ? { turn: t.turn } : {})
      })
    );
  }

  onOutput(playing: boolean) {
    this.options.fallback.onOutput(playing);
    this.send(JSON.stringify({ type: "output", playing }));
  }

  reset() {
    this.options.fallback.reset();
    this.send(JSON.stringify({ type: "reset" }));
  }

  setPatience(factor: number) {
    this.options.fallback.setPatience?.(factor);
    this.send(JSON.stringify({ type: "patience", factor }));
  }

  close() {
    this.closed = true;
    this.socket.terminate();
  }

  private send(data: Buffer | string) {
    if (!this.closed && this.socket.readyState === WebSocket.OPEN)
      this.socket.send(data);
  }

  private use(source: "remote" | "fallback", reason?: string) {
    if (source === this.source) return;
    this.source = source;
    this.options.onSource?.(source, reason);
  }
}

/**
 * Hosts any Detector behind `fonoster.detector.v1` (one Detector per connection). The reference
 * server for out-of-process Detectors and the test double for RemoteDetector.
 */
export async function serveDetector(options: {
  makeDetector: () => Detector;
  port?: number;
  host?: string;
}): Promise<{ port: number; close(): Promise<void> }> {
  const server = http.createServer();
  const wss = new WebSocket.Server({ server });
  wss.on("connection", (socket) => {
    const detector = options.makeDetector();
    let frame = 0;
    socket.on("message", (raw, isBinary) => {
      if (isBinary) {
        const buf = raw as Buffer;
        if (buf.length !== FRAME_BYTES) return;
        frame++;
        const e = detector.onAudio(buf, frame * FRAME_MS);
        socket.send(JSON.stringify({ type: "estimate", frame, ...e }));
        return;
      }
      let m: Record<string, unknown>;
      try {
        m = JSON.parse(raw.toString());
      } catch {
        return socket.close(1008, "bad_message");
      }
      switch (m.type) {
        case "transcript":
          return detector.onTranscript(
            {
              text: String(m.text ?? ""),
              final: m.final === true,
              language: String(m.language ?? ""),
              confidence: Number(m.confidence ?? 0),
              ...(m.turn ? { turn: m.turn as Transcript["turn"] } : {})
            },
            frame * FRAME_MS
          );
        case "output":
          return detector.onOutput(m.playing === true);
        case "reset":
          return detector.reset();
        case "patience":
          return detector.setPatience?.(Number(m.factor));
      }
    });
    socket.on("close", () => detector.close?.());
  });
  await new Promise<void>((resolve) =>
    server.listen(options.port ?? 0, options.host ?? "127.0.0.1", resolve)
  );
  return {
    port: (server.address() as AddressInfo).port,
    close: () =>
      new Promise<void>((resolve) => {
        for (const c of wss.clients) c.terminate();
        wss.close();
        server.close(() => resolve());
      })
  };
}
