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
// The app's side of each session (docs/session-protocol.md): a speech turn loop that hangs up
// when AppBridge falls behind, so SIPp counts the call as failed.
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { settings } from "./settings.ts";
import { histogram, record } from "./stats.ts";

const LINE = "Thanks for calling. Tell me a little more about that.";

export const stats = {
  /** speak → output.started, per speak. */
  speakStartMs: histogram(),
  /** The largest gap between two caller-audio frames, per call. */
  maxCallerGapMs: histogram(),
  calls: 0,
  /** Calls the app hung up, by reason. */
  hungUp: {} as Record<string, number>
};

type Message = {
  type: string;
  id?: string;
  code?: string;
  message?: string;
  reason?: string;
};

function runSession(socket: WebSocket) {
  let sessionRef = "";
  let speaks = 0;
  let pending: { id: string; sentAt: number } | undefined;
  let playing = false;
  let turnWaiting = false;
  let turnTimer: NodeJS.Timeout | undefined;
  let lastFrameAt: number | undefined;
  let maxGapMs = 0;
  let hangUpReason: string | undefined;
  const latencies: number[] = [];

  const hangUp = (reason: string, detail: Record<string, unknown> = {}) => {
    if (hangUpReason) return;
    hangUpReason = reason;
    stats.hungUp[reason] = (stats.hungUp[reason] ?? 0) + 1;
    console.log(
      JSON.stringify({ event: "hangup", sessionRef, reason, ...detail })
    );
    socket.close();
  };

  const speak = () => {
    const id = `s${++speaks}`;
    pending = { id, sentAt: performance.now() };
    playing = true;
    socket.send(JSON.stringify({ type: "speak", id, text: LINE }));
  };

  const onMessage = (msg: Message) => {
    switch (msg.type) {
      case "session.start":
        sessionRef = (msg as { sessionRef?: string }).sessionRef ?? "";
        stats.calls++;
        return speak();
      case "output.started": {
        if (!pending || msg.id !== pending.id) return;
        const ms = performance.now() - pending.sentAt;
        pending = undefined;
        latencies.push(Math.round(ms));
        record(stats.speakStartMs, ms);
        if (ms > settings.speakStartMaxMs)
          hangUp("speak_start", { ms: Math.round(ms) });
        return;
      }
      case "output.done":
      case "output.interrupted":
        playing = false;
        if (turnWaiting) {
          turnWaiting = false;
          return speak();
        }
        clearTimeout(turnTimer);
        turnTimer = setTimeout(
          () => hangUp("turn_timeout", { ms: settings.turnTimeoutMs }),
          settings.turnTimeoutMs
        );
        return;
      case "turn.ended":
        clearTimeout(turnTimer);
        if (playing) turnWaiting = true;
        else speak();
        return;
      case "error":
        return hangUp("error", { code: msg.code, message: msg.message });
    }
  };

  socket.on("message", (data, isBinary) => {
    if (isBinary) {
      const now = performance.now();
      if (lastFrameAt !== undefined) {
        const gap = now - lastFrameAt;
        if (gap > maxGapMs) maxGapMs = gap;
        if (gap > settings.callerAudioGapMaxMs)
          hangUp("caller_audio_gap", { ms: Math.round(gap) });
      }
      lastFrameAt = now;
      return;
    }
    onMessage(JSON.parse(data.toString()) as Message);
  });

  socket.on("close", () => {
    clearTimeout(turnTimer);
    record(stats.maxCallerGapMs, maxGapMs);
    console.log(
      JSON.stringify({
        event: "call",
        sessionRef,
        speakStartMs: latencies,
        maxCallerGapMs: Math.round(maxGapMs),
        ...(hangUpReason ? { hungUp: hangUpReason } : {})
      })
    );
  });
  socket.on("error", () => undefined);
}

export function startApp(port: number) {
  const server = new WebSocketServer({
    host: "127.0.0.1",
    port,
    path: "/session"
  });
  server.on("connection", runSession);
}
