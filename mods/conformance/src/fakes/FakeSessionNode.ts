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
import { randomBytes } from "crypto";
import { EventEmitter } from "events";
import * as fs from "fs";
import { RoomrClient } from "@fonoster/roomr";
import { CalleeMode, FakeCall, FakeNode } from "@fonoster/roomr/fake";
import { generate } from "../audio/codecs";
import { AudioSource } from "../scenario/types";
import { sharedRoomrFake } from "./sharedRoomrFake";

// The Roomr node for AppBridge suites (extract-roomr 2.3): a real node in roomr-fake
// (@fonoster/roomr/fake), whose phone calls it and answers what it dials. For each call the node
// opens its control stream to the session endpoint (AppBridge) exactly as in production; this
// class keeps the API the suites were written against (offerCall, placeCall, caller actions,
// sipStatuses, commands) and mirrors each call's state from the fake while the call lives.

/** The node's Ended causes (media-control "Endings carry a reason"). */
export type EndCause =
  | "caller_hangup"
  | "callee_hangup"
  | "busy"
  | "no_answer"
  | "rejected"
  | "media_timeout"
  | "node_error"
  | "max_duration"
  | "removed"
  | "app_gone";

/** Kept for suites that pass it: the real node negotiates SRTP itself, so it is not used. */
export type SrtpFactory = (key: string) => {
  protect(packet: Buffer): Buffer;
  unprotect(packet: Buffer): Buffer | undefined;
};

export type FakeSessionNodeOptions = {
  nodeId?: string;
  /** The session endpoint (host:port) streams go to; set later with `configure`. */
  endpoint?: string;
  /** Caller audio played once the app answers (then silence). */
  callerAudio?: AudioSource & { pcm16le?: Buffer };
  /** Outcome of the dials of cold and warm transfers (default answered). */
  dialOutcome?: "answered" | "busy" | "no_answer" | "failed";
  /** Delay before a dialed party answers (default 50 ms). */
  answerAfterMs?: number;
  /** Sent as X-App-Ref on inbound INVITEs, as Routr's would be. */
  appRef?: string;
  /** No Answer within this long: 480 and Ended app_gone (default 10 s). */
  answerTimeoutMs?: number;
  /** No Ready within this long on an outbound call: Ended app_gone (default 10 s). */
  readyTimeoutMs?: number;
  /** Not used: the real node does SRTP. */
  srtp?: SrtpFactory;
  /** Not used. */
  keepaliveMs?: number;
  /** Not used: the fake's nodes bind 127.0.0.1. */
  host?: string;
};

/** One message AppBridge sent, as `{ type, ...body }` with the oneof member's name as type. */
export type RecordedCommand = {
  at: number;
  callRef: string;
  command: { type: string; [key: string]: unknown };
};

const POLL_MS = 40;
const RATE = 16000;

const nextRef = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;

/**
 * The phone's outcome for a transfer's dial. no_answer is 480 after the delay rather than ringing
 * until the node's 30 s ring timeout (the node's cause is no_answer either way).
 */
const CALLEE_FOR: Record<string, CalleeMode> = {
  answered: "answer",
  busy: "busy",
  no_answer: "unavailable",
  failed: "decline"
};

/** 16 kHz s16le PCM for a scenario's audio source. */
export function pcm16le(source?: AudioSource & { pcm16le?: Buffer }): Buffer {
  if (!source) return Buffer.alloc(0);
  if (source.pcm16le) return source.pcm16le;
  if (source.kind === "file") return fs.readFileSync(source.file!);
  const samples = generate(source.kind ?? "tone", source.ms ?? 0, RATE);
  return Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
}

/** One call on the node, its state mirrored from the fake. */
export class FakeSessionCall extends EventEmitter {
  /** SIP statuses the caller received (inbound), without 100 Trying. */
  readonly sip: number[] = [];
  readonly commands: RecordedCommand[] = [];
  /** The Ended this call got (cause, SIP status), once it ended. */
  ended?: { cause: EndCause; sipStatus?: number };
  /** The app answered (Answer inbound, Ready outbound) and the node took it. */
  answered = false;
  held = false;
  /** The call's room, once the node created the call. */
  roomRef = "";
  private seen = false;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly node: FakeSessionNode,
    readonly fake: FakeCall,
    readonly direction: "INBOUND" | "OUTBOUND"
  ) {
    super();
  }

  get callRef() {
    return this.fake.callRef;
  }

  /** @internal Mirrors the call until it ends. */
  watch() {
    const tick = async () => {
      try {
        await this.sync();
      } catch {
        // the fake forgot the call or is gone: the next tick tries again
      }
      if (!this.ended) this.timer = setTimeout(tick, POLL_MS);
    };
    void tick();
  }

  /** @internal */
  async sync() {
    const [status, commands] = await Promise.all([
      this.fake.status(),
      this.fake.commands()
    ]);
    for (const c of commands.slice(this.commands.length)) {
      const recorded = c as RecordedCommand;
      this.commands.push(recorded);
      this.node.commands.push(recorded);
      this.node.emit("command", recorded);
    }
    if (this.direction === "INBOUND" && status.phone) {
      const sip = status.phone.sip.filter((s) => s !== 100);
      this.sip.push(...sip.slice(this.sip.length));
    }
    this.held = status.held;
    if (status.roomRef) this.roomRef = status.roomRef;
    const took = this.commands.some((c) =>
      this.direction === "INBOUND"
        ? c.command.type === "answer"
        : c.command.type === "ready" || c.command.type === "answer"
    );
    if (!this.answered && took && status.state === "answered") {
      this.answered = true;
      this.emit("answered");
    }
    // "" is a call the node does not know: not yet (the INVITE is in flight) or not any more.
    if (status.state) this.seen = true;
    if (status.state === "ended" || (status.state === "" && this.seen)) {
      clearTimeout(this.timer);
      // The commands that arrived with the ending (Hangup) and the caller's final response may
      // postdate the reads above: read again, briefly, until the phone's leg ended too.
      await this.refreshCommands();
      for (let i = 0; i < 10 && this.direction === "INBOUND"; i++) {
        const after = await this.fake.status().catch(() => undefined);
        if (after?.phone) {
          const sip = after.phone.sip.filter((s) => s !== 100);
          this.sip.push(...sip.slice(this.sip.length));
          if (after.phone.state === "ended") break;
        }
        await new Promise((r) => setTimeout(r, 20));
      }
      this.ended = {
        cause: (status.cause ?? "node_error") as EndCause,
        ...(status.sipStatus ? { sipStatus: status.sipStatus } : {})
      };
      this.emit("ended", this.ended);
    }
  }

  /** @internal Adds the commands the node recorded since the last read. */
  async refreshCommands() {
    const all = await this.fake.commands().catch(() => []);
    for (const c of all.slice(this.commands.length)) {
      const recorded = c as RecordedCommand;
      this.commands.push(recorded);
      this.node.commands.push(recorded);
      this.node.emit("command", recorded);
    }
  }

  /** The node ends the call with this cause (Ended reaches the app). */
  end(cause: EndCause | string, sipStatus?: number) {
    void this.fake.end(cause, sipStatus).catch(() => undefined);
  }

  /** The caller presses a key. */
  dtmf(digit: string) {
    void this.fake.dtmf(digit).catch(() => undefined);
  }

  /** The caller says something new. */
  speak(pcm: Buffer) {
    if (!pcm.length) return;
    const at = Date.now();
    // 16 kHz s16le: 32 bytes per ms.
    this.node.spoke.push({ from: at, to: at + pcm.length / 32 });
    void this.fake.speak({ pcm }).catch(() => undefined);
  }

  /** @internal */
  stopWatching() {
    clearTimeout(this.timer);
  }
}

/**
 * Plays the Roomr node for AppBridge suites. `offerCall` places an inbound call, `placeCall` an
 * outbound one the callee answers; caller actions and measurements default to the last call.
 */
export class FakeSessionNode extends EventEmitter {
  readonly nodeId: string;
  readonly commands: RecordedCommand[] = [];
  /** When callers spoke (the phone sends from its next frame), oldest first. */
  readonly spoke: { from: number; to: number }[] = [];
  private readonly calls: FakeSessionCall[] = [];
  private node?: Promise<FakeNode>;
  private nodeEndpoint?: string;

  constructor(readonly options: FakeSessionNodeOptions = {}) {
    super();
    this.nodeId = options.nodeId ?? nextRef("fake-node");
  }

  configure(options: Partial<FakeSessionNodeOptions>) {
    Object.assign(this.options, options);
  }

  /** The node, started on first use (again after a crash or an endpoint change). */
  private async fakeNode(): Promise<FakeNode> {
    const endpoint = this.options.endpoint;
    if (!endpoint)
      throw new Error("FakeSessionNode: no session endpoint configured");
    if (this.node && this.nodeEndpoint !== endpoint) {
      const old = this.node;
      this.node = undefined;
      void old.then((n) => n.stop()).catch(() => undefined);
    }
    if (!this.node) {
      this.nodeEndpoint = endpoint;
      this.node = (async () => {
        const fake = await sharedRoomrFake();
        return fake.createNode({
          nodeRef: `${this.nodeId}-${randomBytes(2).toString("hex")}`,
          sessionEndpoint: endpoint,
          answerTimeoutMs: this.options.answerTimeoutMs,
          readyTimeoutMs: this.options.readyTimeoutMs,
          callee: {
            mode: CALLEE_FOR[this.options.dialOutcome ?? "answered"],
            afterMs: this.options.answerAfterMs ?? 50
          }
        });
      })();
      this.node.catch(() => (this.node = undefined));
    }
    return this.node;
  }

  /**
   * An inbound call, as an INVITE through Routr would be: the caller hears 180 and the node opens
   * a stream to the session endpoint with every INVITE header (X-App-Ref, X-Call-Ref, ...) in
   * Start.headers. Resolves once the INVITE is sent.
   */
  async offerCall(
    call: {
      from?: string;
      to?: string;
      appRef?: string;
      callRef?: string;
      /** Not carried: a real INVITE has headers, not metadata. */
      metadata?: Record<string, string>;
      /** More INVITE headers (e.g. X-Connect-Token). */
      headers?: Record<string, string>;
      roomRef?: string;
      /** The caller's offer, e.g. ["PCMU/8000"]. */
      codecs?: string[];
    } = {}
  ): Promise<FakeSessionCall> {
    const node = await this.fakeNode();
    const appRef = call.appRef ?? this.options.appRef;
    const fake = await node.placeCall({
      callRef: call.callRef ?? nextRef("call"),
      from: call.from ?? "+15550001111",
      to: call.to ?? "+15550002222",
      roomRef: call.roomRef,
      codecs: call.codecs,
      headers: {
        ...(appRef ? { "X-App-Ref": appRef } : {}),
        "X-Call-Direction": "inbound",
        ...(call.headers ?? {})
      }
    });
    return this.track(new FakeSessionCall(this, fake, "INBOUND"));
  }

  /**
   * An outbound call (CreateCall from a controller) that the callee answers: the node opens a
   * stream whose Start has direction OUTBOUND and CreateCall's metadata (app_ref, ...).
   */
  async placeCall(call: {
    appRef?: string;
    callRef?: string;
    from?: string;
    to?: string;
    metadata?: Record<string, string>;
    headers?: Record<string, string>;
  }): Promise<FakeSessionCall> {
    const node = await this.fakeNode();
    const callRef = call.callRef ?? nextRef("call");
    await node.callee("answer", { callRef, afterMs: 0 });
    const roomr = new RoomrClient(node.controlAddr);
    try {
      await roomr.createCall({
        callRef,
        from: call.from ?? "+15550001111",
        to: {
          uri: `sip:${call.to ?? "+15550002222"}@carrier`,
          headers: call.headers ?? {}
        },
        metadata: {
          ...(call.appRef ? { app_ref: call.appRef } : {}),
          ...(call.metadata ?? {})
        }
      });
    } finally {
      roomr.close();
    }
    return this.track(
      new FakeSessionCall(this, node.call(callRef), "OUTBOUND")
    );
  }

  /** Tracks a call once the node knows it (its room is set), then mirrors it. */
  private async track(c: FakeSessionCall): Promise<FakeSessionCall> {
    this.calls.push(c);
    // The configured caller audio goes out first, queued by the phone until the answer: queued
    // any later, it would replace what a test says as soon as the app sees session.start.
    if (this.options.callerAudio) c.speak(pcm16le(this.options.callerAudio));
    const deadline = Date.now() + 5000;
    while (!c.roomRef && !c.ended && Date.now() < deadline) {
      await c.sync().catch(() => undefined);
      if (!c.roomRef) await new Promise((r) => setTimeout(r, 10));
    }
    c.watch();
    return c;
  }

  /** Every call's commands, read from the node now (the mirror can trail by a poll). */
  async freshCommands(): Promise<RecordedCommand[]> {
    await Promise.all(this.calls.map((c) => c.refreshCommands()));
    return this.commands;
  }

  /** The call with this ref, else the last one. */
  call(callRef?: string): FakeSessionCall | undefined {
    if (callRef) return this.calls.find((c) => c.callRef === callRef);
    return this.calls[this.calls.length - 1];
  }

  /** SIP statuses the caller of a call received, in order. */
  sipStatuses(callRef?: string): number[] {
    return this.call(callRef)?.sip ?? [];
  }

  /** Whether the call's room has someone on hold, read from the node now. */
  async isHeld(callRef?: string): Promise<boolean> {
    const c = this.call(callRef);
    if (!c) return false;
    const status = await c.fake.status().catch(() => undefined);
    return status?.held ?? c.held;
  }

  /** Listeners added and not yet removed, over every live call. */
  activeListeners(): number {
    const live = new Set<string>();
    for (const c of this.calls) {
      if (c.ended) continue;
      for (const { command } of c.commands) {
        const ref = `${c.callRef}/${String(command.listenerRef ?? "")}`;
        if (command.type === "addListener") live.add(ref);
        if (command.type === "removeListener") live.delete(ref);
      }
    }
    return live.size;
  }

  /**
   * The caller speaks on every live call. Before the answer the phone queues it and sends it once
   * the call is answered: a test speaks as soon as the app sees session.start, which can be
   * before this class saw the answer.
   */
  callerSpeaks(source: AudioSource & { pcm16le?: Buffer }) {
    const pcm = pcm16le(source);
    for (const c of this.calls) if (!c.ended) c.speak(pcm);
  }

  /** The caller presses a key. */
  pressKey(digit: string, callRef?: string) {
    this.call(callRef)?.dtmf(digit);
  }

  /** The caller hangs up: Ended caller_hangup. */
  callerHangup(callRef?: string) {
    const c = this.call(callRef);
    if (c && !c.ended) void c.fake.hangup().catch(() => undefined);
  }

  /** The dialed party of an outbound call hangs up: Ended callee_hangup. */
  calleeHangup(callRef?: string) {
    this.callerHangup(callRef);
  }

  /** The node ends a call itself (media timeout, maximum duration, ...). */
  endCall(cause: EndCause | string, sipStatus?: number, callRef?: string) {
    this.call(callRef)?.end(cause, sipStatus);
  }

  /** Alias of endCall, for scenarios written against the NATS fake. */
  dropRoom(cause: EndCause | string, sipStatus?: number, callRef?: string) {
    this.endCall(cause, sipStatus, callRef);
  }

  /** The node dies: every stream breaks with no Ended. The next call starts a new node. */
  crash() {
    const node = this.node;
    this.node = undefined;
    for (const c of this.calls)
      if (!c.ended) {
        c.stopWatching();
        c.ended = { cause: "node_error" };
        c.emit("ended", c.ended);
      }
    void node?.then((n) => n.kill()).catch(() => undefined);
  }

  /** The node's RTP to the app stops while the stream stays open. */
  stopMedia(callRef?: string) {
    void this.call(callRef)
      ?.fake.stopAppMedia(true)
      .catch(() => undefined);
  }

  /** ms of audible app audio the callers heard since `since` (unix ms), over every call. */
  async outputAudioMs(since: number): Promise<number> {
    const heard = await Promise.all(
      this.calls.map((c) =>
        c.fake.status(since).then(
          (s) => s.phone?.audibleMsSince ?? 0,
          () => 0
        )
      )
    );
    return heard.reduce((a, b) => a + b, 0);
  }

  /** ms between `since` and the last audible app audio a caller heard after it (0: none). */
  async outputSilentWithinMs(since: number): Promise<number> {
    const last = await Promise.all(
      this.calls.map((c) =>
        c.fake.status(since).then(
          (s) => Math.max(0, s.phone?.lastAudibleAfterMs ?? 0),
          () => 0
        )
      )
    );
    return Math.max(0, ...last);
  }

  /** When the first audible caller packet at or after `since` was sent, if one was. */
  firstCallerAudibleSentAt(since: number): number | undefined {
    const sent = this.spoke
      .filter((s) => s.to >= since)
      .map((s) => Math.max(s.from, since));
    return sent.length ? Math.min(...sent) : undefined;
  }

  /** When the caller's queued speech finished (unix ms), if it spoke. */
  async callerSpokeUntil(callRef?: string): Promise<number | undefined> {
    const c = this.call(callRef);
    const s = c ? await c.fake.status() : undefined;
    return s?.phone?.spokeUntilMs || undefined;
  }

  /** Waits until the call (default: the last) ended; resolves with its Ended. */
  ended(
    callRef?: string,
    timeoutMs = 5000
  ): Promise<{ cause: EndCause; sipStatus?: number }> {
    const c = this.call(callRef);
    if (!c) return Promise.reject(new Error("no call"));
    if (c.ended) return Promise.resolve(c.ended);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("the call did not end")),
        timeoutMs
      );
      c.once("ended", (e) => {
        clearTimeout(timer);
        resolve(e);
      });
    });
  }

  /** Waits until the call (default: the last) is answered (Answer or Ready). */
  answered(callRef?: string, timeoutMs = 5000): Promise<void> {
    const c = this.call(callRef);
    if (!c) return Promise.reject(new Error("no call"));
    if (c.answered) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("the call was not answered")),
        timeoutMs
      );
      c.once("answered", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  async stop() {
    for (const c of this.calls) c.stopWatching();
    const node = this.node;
    this.node = undefined;
    await node?.then((n) => n.stop()).catch(() => undefined);
    this.removeAllListeners();
  }

  /** Caller audio as 16 kHz s16le PCM. */
  audioFor(source?: AudioSource & { pcm16le?: Buffer }): Buffer {
    return pcm16le(source);
  }
}
