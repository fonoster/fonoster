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
import { SessionStart } from "@fonoster/common";
import { SessionEndedError, SessionError } from "./errors";
import {
  GatherOptions,
  GatherResult,
  PlayOptions,
  PlayResult,
  SayOptions,
  SayResult,
  SessionEventMap,
  SessionEventName,
  TransferOptions
} from "./types";

/** What the session needs from its socket. */
export type SessionTransport = {
  sendJson(message: Record<string, unknown>): void;
  sendBinary(data: Buffer): void;
  close(): void;
};

type Output = {
  text: string;
  startedAt?: number;
  interruptible: boolean;
  resolve: (r: SayResult) => void;
  reject: (e: Error) => void;
};

type EndWaiter = {
  reasons: string[];
  resolve: () => void;
  reject: (e: Error) => void;
};

type Gather = {
  speech: boolean;
  dtmf: boolean;
  maxDigits?: number;
  finishOnKey?: string;
  timeoutMs: number;
  digits: string;
  timer?: ReturnType<typeof setTimeout>;
  resolve: (r: GatherResult) => void;
  reject: (e: Error) => void;
};

type Input =
  | { type: "dtmf"; digit: string }
  | { type: "turn.ended"; text: string }
  | { type: "turn.user_started" };

const DEFAULT_GATHER_TIMEOUT_MS = 4000;
/** Commands that make AppBridge start listening (speech recognition and turn events). */
const SPEECH_COMMANDS = new Set([
  "speak",
  "play",
  "subscribe",
  "listen.update"
]);
const MAX_BUFFERED_INPUTS = 32;

/**
 * One call's session, built on the fonoster.session.v1 messages (voice-sdk S8). Verbs are
 * conveniences: each sends one command and resolves on the event that answers it.
 */
export class Session {
  readonly sessionRef: string;
  readonly callRef: string;
  readonly appRef: string;
  readonly direction: SessionStart["direction"];
  readonly from: string;
  readonly to: string;
  readonly metadata: Record<string, unknown>;
  /** The W3C traceparent of the call's span (session.start `traceparent`), when sent. */
  readonly traceparent?: string;
  /** The payload of the handoff that started this session (session.start `handoff`), or null. */
  readonly handoffPayload: Record<string, unknown> | null;
  readonly speech: SessionStart["speech"];
  readonly audioFormat: SessionStart["audio"];
  readonly tracks: SessionStart["tracks"];
  /**
   * The app and workspace AppBridge's app-bound signature named, when the server verified one
   * (VoiceServer); undefined otherwise.
   */
  readonly signedFor?: { appRef: string; workspaceRef: string };

  /** Raw audio (the Audio layer). */
  readonly audio: {
    onFrame(cb: (frame: Buffer, trackId: number) => void): void;
    send(frame: Buffer): void;
    mark(name: string): Promise<{ cleared: boolean }>;
    clear(): void;
  };

  private seq = 0;
  private outputs = new Map<string, Output>();
  private commands = new Map<string, (e: Error) => void>();
  private marks = new Map<string, ((r: { cleared: boolean }) => void)[]>();
  private endWaiters: EndWaiter[] = [];
  private listeners = new Map<string, Set<(data: unknown) => void>>();
  private frameListeners = new Set<(frame: Buffer, trackId: number) => void>();
  private gatherState?: Gather;
  private buffered: Input[] = [];
  private lastWarmTransfer?: string;
  /** A pending completeTransfer(), rejected when AppBridge refuses it. */
  private completing?: (e: Error) => void;
  private endedReason?: string;
  private listening = false;

  constructor(
    start: SessionStart,
    private readonly transport: SessionTransport,
    signedFor?: { appRef: string; workspaceRef: string }
  ) {
    this.signedFor = signedFor;
    this.sessionRef = start.sessionRef;
    this.callRef = start.callRef;
    this.appRef = start.appRef;
    this.direction = start.direction;
    this.from = start.from;
    this.to = start.to;
    this.metadata = (start.metadata ?? {}) as Record<string, unknown>;
    this.traceparent = start.traceparent;
    this.handoffPayload = (start.handoff ?? null) as Record<
      string,
      unknown
    > | null;
    this.speech = start.speech;
    this.audioFormat = start.audio;
    this.tracks = start.tracks;

    this.audio = {
      onFrame: (cb) => void this.frameListeners.add(cb),
      send: (frame) => this.transport.sendBinary(frame),
      mark: (name) =>
        new Promise((resolve, reject) => {
          if (this.endedReason)
            return reject(new SessionEndedError(this.endedReason));
          const list = this.marks.get(name) ?? [];
          list.push(resolve);
          this.marks.set(name, list);
          this.send({ type: "mark", name });
        }),
      clear: () => this.send({ type: "clear" })
    };
  }

  get ended(): boolean {
    return this.endedReason !== undefined;
  }

  // ---- speech -----------------------------------------------------------------------

  /** Speaks text, or a stream of text pieces as one utterance, and reports what was heard. */
  async say(
    input: string | AsyncIterable<string>,
    options: SayOptions = {}
  ): Promise<SayResult> {
    const id = this.nextId("say");
    const fields = this.compact({
      voice: options.voice,
      language: options.language,
      interruptible: options.interruptible,
      preempt: options.preempt
    });

    if (typeof input === "string") {
      const done = this.awaitOutput(id, input, options.interruptible ?? true);
      this.send({ type: "speak", id, text: input, last: true, ...fields });
      return done;
    }

    let text = "";
    const done = this.awaitOutput(id, "", options.interruptible ?? true);
    try {
      for await (const piece of input) {
        text += piece;
        this.send({ type: "speak", id, text: piece, last: false, ...fields });
      }
    } catch (e) {
      // End the utterance so AppBridge does not wait for more pieces.
      this.send({ type: "speak", id, text: "", last: true, ...fields });
      this.outputs.delete(id);
      done.catch(() => undefined);
      throw e;
    }
    const output = this.outputs.get(id);
    if (output) output.text = text;
    this.send({ type: "speak", id, text: "", last: true, ...fields });
    return done;
  }

  /** Cuts the agent off: every pending say and play resolves as interrupted. */
  async stopSay(): Promise<void> {
    this.send({ type: "clear" });
  }

  async play(url: string, options: PlayOptions = {}): Promise<PlayResult> {
    const id = this.nextId("play");
    const done = this.awaitOutput(id, "", options.interruptible ?? true);
    this.send({ type: "play", id, url, ...this.compact(options) });
    const r = await done;
    return { interrupted: r.interrupted, heardMs: r.heardMs };
  }

  /** Waits for speech (turn.ended) or digits (dtmf), whichever comes first. */
  gather(options: GatherOptions = {}): Promise<GatherResult> {
    if (this.endedReason)
      return Promise.reject(new SessionEndedError(this.endedReason));
    if (this.gatherState)
      return Promise.reject(new Error("a gather is already pending"));
    const source = options.source ?? "speech_and_dtmf";
    // AppBridge listens only after a Speech-layer command; a gather may be the first one.
    if (source !== "dtmf" && !this.listening)
      this.send({ type: "listen.update" });
    return new Promise((resolve, reject) => {
      const g: Gather = {
        speech: source !== "dtmf",
        dtmf: source !== "speech",
        maxDigits: options.maxDigits,
        finishOnKey: options.finishOnKey,
        timeoutMs: options.timeout ?? DEFAULT_GATHER_TIMEOUT_MS,
        digits: "",
        resolve,
        reject
      };
      this.gatherState = g;
      this.armGatherTimer(g);
      // Inputs that arrived before the gather (type-ahead) count, in order.
      const backlog = this.buffered;
      this.buffered = [];
      for (const input of backlog) {
        if (this.gatherState !== g) break;
        this.feedGather(input);
      }
    });
  }

  /**
   * Starts listening or changes how AppBridge listens (`listen.update`): recognition language,
   * hints, and the turn-taking patience knob (`low`, `normal` or `high`).
   */
  async listen(
    options: {
      language?: string;
      hints?: string[];
      patience?: "low" | "normal" | "high";
    } = {}
  ): Promise<void> {
    this.send({ type: "listen.update", ...this.compact(options) });
  }

  /** Requests opt-in events: "turn.estimate", "transcript.partial". */
  async subscribe(
    events: ("turn.estimate" | "transcript.partial")[]
  ): Promise<void> {
    this.send({ type: "subscribe", events });
  }

  on<E extends SessionEventName>(
    event: E,
    cb: (data: SessionEventMap[E]) => void
  ): this {
    const set = this.listeners.get(event) ?? new Set();
    set.add(cb as (data: unknown) => void);
    this.listeners.set(event, set);
    return this;
  }

  off<E extends SessionEventName>(
    event: E,
    cb: (data: SessionEventMap[E]) => void
  ): this {
    this.listeners.get(event)?.delete(cb as (data: unknown) => void);
    return this;
  }

  // ---- control ----------------------------------------------------------------------

  async playDtmf(digits: string): Promise<void> {
    this.command({ type: "dtmf.send", digits });
  }

  /** Transfers the call; resolves when AppBridge ends the session with reason transfer. */
  transfer(to: string, options: TransferOptions = {}): Promise<void> {
    const id = this.nextId("transfer");
    if (options.mode === "warm") this.lastWarmTransfer = id;
    return this.untilEnd(["transfer"], id, () =>
      this.send({
        type: "transfer",
        id,
        to,
        ...this.compact({ mode: options.mode, headers: options.headers })
      })
    );
  }

  /**
   * Completes the pending warm transfer: the agent leaves, caller and new party stay. Resolves
   * when the session ends with reason transfer; rejects with a SessionError
   * (`transfer_not_answered`) when the new party has not answered yet, which leaves the transfer
   * pending: wait for the `transfer.answered` event and call it again.
   */
  completeTransfer(): Promise<void> {
    const id = this.lastWarmTransfer;
    if (!id) return Promise.reject(new Error("no warm transfer is pending"));
    return new Promise((resolve, reject) => {
      if (this.endedReason)
        return reject(new SessionEndedError(this.endedReason));
      const waiter: EndWaiter = { reasons: ["transfer"], resolve, reject };
      this.endWaiters.push(waiter);
      this.completing = (e) => {
        this.endWaiters = this.endWaiters.filter((w) => w !== waiter);
        reject(e);
      };
      try {
        this.send({ type: "transfer.complete", id });
      } catch (e) {
        this.completing = undefined;
        reject(e);
      }
    });
  }

  async hold(options: { music?: string } = {}): Promise<void> {
    this.command({ type: "hold", ...this.compact(options) });
  }

  async resume(): Promise<void> {
    this.command({ type: "resume" });
  }

  /** Hands the call to another app with a payload; resolves when this session ends. */
  handoff(app: string, payload: Record<string, unknown> = {}): Promise<void> {
    const id = this.nextId("handoff");
    return this.untilEnd(["handoff"], id, () =>
      this.send({ type: "handoff", id, app, payload })
    );
  }

  /** Hangs up; resolves when the session ends. */
  hangup(): Promise<void> {
    if (this.endedReason) return Promise.resolve();
    return this.untilEnd(
      ["app_hangup", "caller_hangup", "closed"],
      undefined,
      () => this.send({ type: "hangup" })
    );
  }

  /**
   * Adds a note to the call record (record.note).
   *
   * @internal Reserved for Fonoster's own apps (Autopilot); not part of the public SDK and may change.
   */
  async note(data: Record<string, unknown>): Promise<void> {
    this.command({ type: "record.note", data });
  }

  /**
   * Adds model token usage to the call (usage.report, add-usage-metering).
   *
   * @internal Reserved for Fonoster's own Autopilot; AppBridge refuses it from other apps.
   */
  async reportUsage(lines: Record<string, unknown>[]): Promise<void> {
    this.command({ type: "usage.report", lines });
  }

  /** Resolves at once: AppBridge answers the call on connect (voice-sdk S2). */
  async answer(): Promise<void> {}

  // ---- incoming ---------------------------------------------------------------------

  /** Feeds one frame from the socket. */
  receive(data: Buffer, isBinary: boolean) {
    if (isBinary) {
      const trackId = data[0];
      const frame = data.subarray(1);
      for (const cb of this.frameListeners) cb(frame, trackId);
      return;
    }
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    this.onMessage(msg);
  }

  /** The socket closed. */
  closed() {
    this.finish("closed");
  }

  private onMessage(msg: Record<string, unknown>) {
    const type = msg.type as string;
    switch (type) {
      case "output.started": {
        const o = this.outputs.get(msg.id as string);
        if (o) o.startedAt = Date.now();
        return;
      }
      case "output.done": {
        const o = this.take(msg.id as string);
        o?.resolve({
          interrupted: false,
          heardText: o.text,
          heardMs: o.startedAt ? Date.now() - o.startedAt : 0,
          startedAt: o.startedAt
        });
        return;
      }
      case "output.interrupted": {
        const o = this.take(msg.id as string);
        o?.resolve({
          interrupted: true,
          heardText: String(msg.heardText ?? ""),
          heardMs: Number(msg.heardMs ?? 0),
          startedAt: o.startedAt
        });
        return;
      }
      case "mark": {
        const list = this.marks.get(msg.name as string);
        const resolve = list?.shift();
        if (list && !list.length) this.marks.delete(msg.name as string);
        resolve?.({ cleared: msg.cleared === true });
        return;
      }
      case "error":
        return this.onError(msg);
      case "session.end":
        return this.finish(String(msg.reason ?? "closed"));
      case "dtmf":
        this.emit("dtmf", { digit: msg.digit });
        return this.input({ type: "dtmf", digit: String(msg.digit) });
      case "turn.ended":
        this.emit(type, this.without(msg, "type"));
        return this.input({ type: "turn.ended", text: String(msg.text ?? "") });
      case "turn.user_started":
        this.bargeIn();
        this.emit(type, {});
        return this.input({ type: "turn.user_started" });
      case "turn.likely_ended":
      case "turn.resumed":
      case "turn.backchannel":
      case "transcript.partial":
      case "turn.estimate":
      case "amd.result":
      case "transfer.answered":
        return this.emit(type, this.without(msg, "type"));
      default:
      // Unknown types are ignored (additive-only protocol).
    }
  }

  private onError(msg: Record<string, unknown>) {
    const error = new SessionError(
      String(msg.code),
      String(msg.message ?? msg.code),
      msg.fatal === true
    );
    const id = msg.relatesTo as string | undefined;
    // A refused completeTransfer() fails that call, not the pending transfer.
    if (error.code === "transfer_not_answered" && this.completing) {
      const completing = this.completing;
      this.completing = undefined;
      completing(error);
      return;
    }
    const output = id ? this.take(id) : undefined;
    const command = id ? this.commands.get(id) : undefined;
    if (output) output.reject(error);
    else if (command) {
      this.commands.delete(id!);
      command(error);
    } else {
      this.emit("error", {
        code: error.code,
        message: error.message,
        fatal: error.fatal
      });
    }
    if (error.fatal) this.finish("error");
  }

  // ---- gather -----------------------------------------------------------------------

  private input(input: Input) {
    if (this.gatherState) return this.feedGather(input);
    if (input.type === "turn.user_started") return;
    this.buffered.push(input);
    if (this.buffered.length > MAX_BUFFERED_INPUTS) this.buffered.shift();
  }

  private feedGather(input: Input) {
    const g = this.gatherState!;
    if (input.type === "turn.user_started") {
      // The caller is talking: wait for the end of the turn instead of timing out mid-sentence.
      if (g.speech && !g.digits && g.timer) clearTimeout(g.timer);
      return;
    }
    if (input.type === "turn.ended") {
      // First input wins: once digits started, speech is ignored.
      if (g.speech && !g.digits) this.endGather({ speech: input.text });
      return;
    }
    if (!g.dtmf) return;
    if (g.finishOnKey && input.digit === g.finishOnKey)
      return this.endGather({ digits: g.digits });
    g.digits += input.digit;
    if (g.maxDigits && g.digits.length >= g.maxDigits)
      return this.endGather({ digits: g.digits });
    this.armGatherTimer(g);
  }

  private armGatherTimer(g: Gather) {
    if (g.timer) clearTimeout(g.timer);
    g.timer = setTimeout(
      () => this.endGather(g.digits ? { digits: g.digits } : {}),
      g.timeoutMs
    );
  }

  private endGather(result: GatherResult) {
    const g = this.gatherState;
    if (!g) return;
    if (g.timer) clearTimeout(g.timer);
    this.gatherState = undefined;
    g.resolve(result);
  }

  // ---- internals --------------------------------------------------------------------

  private nextId(kind: string): string {
    return `${kind}-${++this.seq}`;
  }

  private send(message: Record<string, unknown>) {
    if (this.endedReason) throw new SessionEndedError(this.endedReason);
    if (SPEECH_COMMANDS.has(message.type as string)) this.listening = true;
    this.transport.sendJson(message);
  }

  /** Sends a command whose only answer is a possible error (logged as a session error). */
  private command(message: Record<string, unknown>) {
    const id = this.nextId(String(message.type).replace(".", "-"));
    this.send({ ...message, id });
  }

  private awaitOutput(
    id: string,
    text: string,
    interruptible = true
  ): Promise<SayResult> {
    return new Promise((resolve, reject) => {
      if (this.endedReason)
        return reject(new SessionEndedError(this.endedReason));
      this.outputs.set(id, { text, resolve, reject, interruptible });
    });
  }

  /**
   * The app owns interruption (appbridge B22): when the caller starts talking over an interruptible
   * say or play, the SDK cuts it off with clear; a non-interruptible one keeps playing.
   */
  private bargeIn() {
    const playing = [...this.outputs.values()].filter(
      (o) => o.startedAt !== undefined
    );
    if (playing.length && playing.every((o) => o.interruptible))
      this.send({ type: "clear" });
  }

  private take(id: string): Output | undefined {
    const o = this.outputs.get(id);
    this.outputs.delete(id);
    return o;
  }

  private untilEnd(
    reasons: string[],
    id: string | undefined,
    sendIt: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.endedReason)
        return reject(new SessionEndedError(this.endedReason));
      const waiter: EndWaiter = { reasons, resolve, reject };
      this.endWaiters.push(waiter);
      if (id) {
        this.commands.set(id, (e) => {
          this.endWaiters = this.endWaiters.filter((w) => w !== waiter);
          reject(e);
        });
      }
      try {
        sendIt();
      } catch (e) {
        reject(e);
      }
    });
  }

  private finish(reason: string) {
    if (this.endedReason) return;
    this.endedReason = reason;
    this.completing = undefined;
    const ended = new SessionEndedError(reason);

    for (const w of this.endWaiters) {
      if (w.reasons.includes(reason)) w.resolve();
      else w.reject(ended);
    }
    this.endWaiters = [];
    for (const o of this.outputs.values()) o.reject(ended);
    this.outputs.clear();
    this.commands.clear();
    for (const list of this.marks.values())
      for (const r of list) r({ cleared: true });
    this.marks.clear();
    if (this.gatherState) {
      const g = this.gatherState;
      if (g.timer) clearTimeout(g.timer);
      this.gatherState = undefined;
      g.reject(ended);
    }
    this.emit("end", { reason });
    this.transport.close();
  }

  private emit(event: string, data: unknown) {
    for (const cb of this.listeners.get(event) ?? []) {
      try {
        cb(data);
      } catch {
        // A listener's failure must not break the session.
      }
    }
  }

  private compact<T extends Record<string, unknown>>(o: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(o).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
  }

  private without(msg: Record<string, unknown>, key: string) {
    const { [key]: _, ...rest } = msg;
    void _;
    return rest;
  }
}
