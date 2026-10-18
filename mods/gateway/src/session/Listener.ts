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
import { publicWebSocketGuard, SessionStart } from "@fonoster/common";
import WebSocket from "ws";
import { convert, INTERNAL, parseCodec } from "../audio/pcm";
import { AGENT_TRACK_ID, CALLER_TRACK_ID } from "../protocols/fonoster";
import { AppBinding, signatureHeaders } from "../signing";

export type ListenerTracks = "inbound" | "outbound" | "both";

export const MAX_LISTENERS = 4;

/**
 * A listen-only socket (voice-session, "Listen-only sockets"). It receives the same events as
 * the controlling app and the tracks it chose, each binary frame tagged with its track id and
 * never mixed. Any command it sends is answered with error read_only; audio from it is dropped.
 */
export class Listener {
  private readonly format;
  private readonly inbound: boolean;
  private readonly outbound: boolean;

  constructor(
    private readonly socket: WebSocket,
    tracks: ListenerTracks,
    audio: { codec: string; rate: number },
    onCommand: (command: Record<string, unknown>) => void
  ) {
    this.format = parseCodec(audio.codec, audio.rate);
    this.inbound = tracks === "inbound" || tracks === "both";
    this.outbound = tracks === "outbound" || tracks === "both";
    socket.on("message", (raw: WebSocket.Data, isBinary: boolean) => {
      if (isBinary) return;
      try {
        const data = JSON.parse(raw.toString());
        if (data && typeof data.type === "string") onCommand(data);
      } catch {
        // Not JSON: nothing to answer.
      }
    });
    socket.on("error", () => undefined);
  }

  /** Dials a listener, signed with the app's secret and bound to the app (and workspace). */
  static async connect(
    url: string,
    secret: string,
    binding: AppBinding,
    timeoutMs = 2000,
    publicOnly = false
  ): Promise<WebSocket> {
    // Tenant-chosen URLs must reach public addresses only (M14).
    const guard = publicOnly ? publicWebSocketGuard(url) : undefined;
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url, {
        headers: signatureHeaders(url, secret, undefined, binding),
        handshakeTimeout: timeoutMs,
        ...(guard ? { lookup: guard.lookup } : {})
      });
      socket.once("open", () => resolve(socket));
      socket.once("unexpected-response", (_req, res) => {
        socket.terminate();
        reject(new Error(`HTTP ${res.statusCode}`));
      });
      socket.once("error", reject);
    });
  }

  get open() {
    return this.socket.readyState === WebSocket.OPEN;
  }

  start(start: SessionStart) {
    this.json(start as unknown as Record<string, unknown>);
  }

  json(message: Record<string, unknown>) {
    if (this.open) this.socket.send(JSON.stringify(message));
  }

  callerAudio(frame: Buffer) {
    if (this.inbound) this.audio(CALLER_TRACK_ID, frame);
  }

  agentAudio(frame: Buffer) {
    if (this.outbound) this.audio(AGENT_TRACK_ID, frame);
  }

  close() {
    if (this.open) this.socket.close(1000);
  }

  private audio(track: number, frame: Buffer) {
    if (this.open)
      this.socket.send(
        Buffer.concat([
          Buffer.from([track]),
          convert(frame, INTERNAL, this.format)
        ])
      );
  }
}
