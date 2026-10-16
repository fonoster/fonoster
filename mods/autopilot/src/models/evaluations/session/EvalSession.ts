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
import { EventEmitter } from "events";
import { SessionEndedError } from "@fonoster/voice";

/** What the engine did on the session, in order. */
export type EvalOutput =
  | {
      kind: "say";
      text: string;
      /** True when the engine streamed the reply (say with an async iterable). */
      streamed: boolean;
      /** The pieces as they arrived (sentences, for a streamed reply). */
      pieces: string[];
    }
  | { kind: "play"; url: string }
  | { kind: "dtmf"; digits: string }
  | { kind: "hangup" }
  | { kind: "transfer"; to: string };

export type EvalTelephony = {
  callDirection?: string;
  ingressNumber?: string;
  callerNumber?: string;
  metadata?: Record<string, string>;
};

/**
 * An in-memory session for conversation evals (rework-autopilot 1.4): the session engine runs on
 * it exactly as on a call, but there is no gateway, socket or audio. Turns go in as `turn.ended`;
 * every reply is "heard" in full (no barge-in in an eval).
 */
export class EvalSession {
  readonly outputs: EvalOutput[] = [];
  readonly sessionRef = "eval-session";
  readonly callRef = "eval-call";
  readonly appRef = "eval-app";
  readonly direction: string;
  readonly from: string;
  readonly to: string;
  readonly metadata: Record<string, string>;
  private readonly events = new EventEmitter();
  private pending = 0;
  private endedReason?: string;

  constructor(telephony: EvalTelephony = {}) {
    this.direction = (telephony.callDirection ?? "FROM_PSTN").startsWith("TO")
      ? "outbound"
      : "inbound";
    this.from = telephony.callerNumber ?? "";
    this.to = telephony.ingressNumber ?? "";
    this.metadata = telephony.metadata ?? {};
    this.events.setMaxListeners(50);
  }

  get ended() {
    return this.endedReason !== undefined;
  }

  /** Says in flight (a streamed reply is in flight until its last piece). */
  get busy() {
    return this.pending > 0;
  }

  on(event: string, listener: (payload: never) => void) {
    this.events.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /** Observe outputs as they are recorded (the evaluator waits on these). */
  onOutput(listener: (output: EvalOutput) => void) {
    this.events.on("__output", listener);
  }

  /** The caller finished a turn. */
  turn(text: string) {
    this.events.emit("turn.ended", {
      type: "turn.ended",
      text,
      language: "en",
      confidence: 1,
      durationMs: 0
    });
  }

  /** The call is over (end of scenario, or the engine hung up or transferred). */
  end(reason = "eval_done") {
    if (this.ended) return;
    this.endedReason = reason;
    this.events.emit("end", { type: "session.end", reason });
  }

  // ---- the Session surface the engine uses ---------------------------------------------

  async say(input: string | AsyncIterable<string>, _options: unknown = {}) {
    this.assertOpen();
    this.pending++;
    try {
      const pieces: string[] = [];
      if (typeof input === "string") pieces.push(input);
      else for await (const piece of input) pieces.push(piece);
      const text = pieces.join("");
      this.record({
        kind: "say",
        text,
        streamed: typeof input !== "string",
        pieces
      });
      return { interrupted: false, heardText: text, heardMs: 0 };
    } finally {
      this.pending--;
    }
  }

  async stopSay() {}

  async play(url: string, _options: unknown = {}) {
    this.assertOpen();
    this.record({ kind: "play", url });
    return { interrupted: false, heardMs: 0 };
  }

  async playDtmf(digits: string) {
    this.assertOpen();
    this.record({ kind: "dtmf", digits });
  }

  async subscribe(_events: string[]) {}

  async listen(_options: unknown) {}

  async note(_data: Record<string, unknown>) {}

  async hangup() {
    if (this.ended) return;
    this.record({ kind: "hangup" });
    this.end("hangup");
  }

  async transfer(to: string) {
    this.assertOpen();
    this.record({ kind: "transfer", to });
    this.end("transferred");
  }

  private record(output: EvalOutput) {
    this.outputs.push(output);
    this.events.emit("__output", output);
  }

  private assertOpen() {
    if (this.endedReason) throw new SessionEndedError(this.endedReason);
  }
}
