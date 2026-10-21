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
import * as dgram from "dgram";
import { EventEmitter } from "events";
import * as fs from "fs";
import { Roomr } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import {
  AudioFormat,
  durationMs,
  encode,
  FRAME_MS,
  generate,
  isAudible,
  parseFormat,
  frames as splitFrames
} from "../audio/codecs";
import { AudioSource } from "../scenario/types";

// A fake Roomr node for AppBridge suites (redesign-roomr 11.1, 11.7): the node's side of the
// per-call control stream. For each call it opens a new connection to the session endpoint
// (AppBridge), sends Start with the call's headers, metadata and its RTP endpoint, and plays the
// node's part of the protocol: 180 then 200 on Answer, the Reject status, Ready for outbound
// calls, ParticipantJoined for the caller's and the app's legs, Dtmf, TransferResult, Ended with
// a cause. Caller audio goes to the app's endpoint as real RTP over UDP (L16/16000, PT 96, 20 ms,
// silence included) and the app's audio is recorded. It knows nothing about speech.

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

/** SRTP for an encrypted app leg: the suite AppBridge uses, supplied by the suite under test. */
export type SrtpFactory = (key: string) => {
  protect(packet: Buffer): Buffer;
  unprotect(packet: Buffer): Buffer | undefined;
};

export type FakeSessionNodeOptions = {
  nodeId?: string;
  /** The session endpoint (host:port) streams go to; set later with `configure`. */
  endpoint?: string;
  /** Address the node's RTP sockets bind to and advertise (default 127.0.0.1). */
  host?: string;
  /** Caller audio played to the app once it answers (then silence, never a gap). */
  callerAudio?: AudioSource & { pcm16le?: Buffer };
  /** Outcome of cold and warm transfers (default answered). */
  dialOutcome?: "answered" | "busy" | "no_answer" | "failed";
  /** Delay before a transfer target answers (default 50 ms). */
  answerAfterMs?: number;
  /** Sent as X-App-Ref in Start.headers, as Routr's would be. */
  appRef?: string;
  /** No Answer within this long: 480 and Ended app_gone (default 10 s). */
  answerTimeoutMs?: number;
  /** No Ready within this long on an outbound call: Ended app_gone (default 10 s). */
  readyTimeoutMs?: number;
  /** Encrypts the app leg when the app answers with its own key. */
  srtp?: SrtpFactory;
  /** gRPC keepalive ping interval on each stream's connection (default 10 s). */
  keepaliveMs?: number;
};

/** One message AppBridge sent, as `{ type, ...body }` with the oneof member's name as type. */
export type RecordedCommand = {
  at: number;
  callRef: string;
  command: { type: string; [key: string]: unknown };
};

type ReceivedPacket = { at: number; ms: number; audible: boolean };

const CODEC = "L16/16000";
const FORMAT: AudioFormat = parseFormat(CODEC);
const PAYLOAD_TYPE = 96;
const SAMPLES_PER_FRAME = (FORMAT.rate / 1000) * FRAME_MS;

let counter = 0;
const nextRef = (prefix: string) =>
  `${prefix}-${++counter}-${randomBytes(3).toString("hex")}`;

/** One listener fork: one track's payloads re-sent as their own RTP stream. */
class Fork {
  private socket = dgram.createSocket("udp4");
  private seq = Math.floor(Math.random() * 0xffff);
  private timestamp = Math.floor(Math.random() * 0xffffffff);
  private readonly ssrc = Math.floor(Math.random() * 0xffffffff);
  closed = false;

  constructor(private readonly remote: { host: string; port: number }) {
    this.socket.on("error", () => undefined);
  }

  send(payload: Buffer) {
    if (this.closed) return;
    this.socket.send(
      rtpPacket(this.seq, this.timestamp, this.ssrc, payload),
      this.remote.port,
      this.remote.host
    );
    this.seq = (this.seq + 1) & 0xffff;
    this.timestamp = (this.timestamp + SAMPLES_PER_FRAME) >>> 0;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.socket.close();
    } catch {
      // already closed
    }
  }
}

function rtpPacket(
  seq: number,
  timestamp: number,
  ssrc: number,
  payload: Buffer
): Buffer {
  const packet = Buffer.alloc(12 + payload.length);
  packet[0] = 0x80;
  packet[1] = PAYLOAD_TYPE;
  packet.writeUInt16BE(seq, 2);
  packet.writeUInt32BE(timestamp >>> 0, 4);
  packet.writeUInt32BE(ssrc >>> 0, 8);
  payload.copy(packet, 12);
  return packet;
}

/** One call on the fake node: its stream, its app-leg RTP and what happened. */
export class FakeSessionCall extends EventEmitter {
  readonly sip: number[] = [];
  readonly received: ReceivedPacket[] = [];
  /** When each audible caller packet left for AppBridge. */
  readonly sentAudible: number[] = [];
  readonly commands: RecordedCommand[] = [];
  readonly callerRef = nextRef("p-caller");
  readonly appRef = nextRef("p-app");
  /** The Ended this call got (cause, SIP status), once it ended. */
  ended?: { cause: EndCause; sipStatus?: number };
  answered = false;
  held = false;
  /** Stops sending caller RTP (the app then times out on media). */
  silent = false;
  /** The app's MediaEndpoint from Answer or Ready. */
  appMedia?: Roomr.MediaEndpoint;
  readonly nodeKey = randomBytes(30).toString("base64");
  stream?: Roomr.SessionClientStream;
  private client?: grpc.Client;
  private socket = dgram.createSocket("udp4");
  private port = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private pending: Buffer[] = [];
  private seq = Math.floor(Math.random() * 0xffff);
  private timestamp = Math.floor(Math.random() * 0xffffffff);
  private readonly ssrc = Math.floor(Math.random() * 0xffffffff);
  private outbound?: ReturnType<SrtpFactory>;
  private inbound?: ReturnType<SrtpFactory>;
  private callerForks: Fork[] = [];
  private appForks: Fork[] = [];
  readonly listenerForks = new Map<string, Fork[]>();
  /** A warm transfer's new party, until TransferComplete. */
  warmParty?: string;
  private waitTimer?: ReturnType<typeof setTimeout>;

  constructor(
    readonly node: FakeSessionNode,
    readonly callRef: string,
    readonly roomRef: string,
    readonly direction: "INBOUND" | "OUTBOUND"
  ) {
    super();
    this.socket.on("message", (msg) => this.onPacket(msg));
    this.socket.on("error", () => undefined);
  }

  async bind(host: string): Promise<Roomr.MediaEndpoint> {
    await new Promise<void>((resolve) => this.socket.bind(0, host, resolve));
    this.port = this.socket.address().port;
    return { ip: host, port: this.port, codec: CODEC, srtpKey: this.nodeKey };
  }

  /** Opens the stream and sends Start. */
  open(
    endpoint: string,
    start: Omit<Roomr.SessionStart, "media">,
    media: Roomr.MediaEndpoint,
    keepaliveMs: number
  ) {
    const Client = Roomr.sessionClient();
    this.client = new Client(endpoint, grpc.credentials.createInsecure(), {
      "grpc.keepalive_time_ms": keepaliveMs,
      "grpc.keepalive_timeout_ms": keepaliveMs * 2,
      "grpc.keepalive_permit_without_calls": 1
    });
    const stream = (
      this.client as unknown as { Connect(): Roomr.SessionClientStream }
    ).Connect();
    this.stream = stream;
    stream.on("data", (m: Roomr.AppMessage) => this.onMessage(m));
    stream.on("error", () => this.onGone());
    stream.on("end", () => this.onGone());
    stream.write({ start: { ...start, media } });
  }

  /** Waits for Answer (inbound) or Ready (outbound) up to `ms`. */
  waitForApp(ms: number) {
    this.waitTimer = setTimeout(() => {
      if (this.answered || this.ended) return;
      if (this.direction === "INBOUND") this.sip.push(480);
      this.end("app_gone", this.direction === "INBOUND" ? 480 : undefined);
    }, ms);
  }

  // ---- node → app ---------------------------------------------------------------------

  send(message: Roomr.NodeMessage) {
    if (!this.stream || this.ended) return;
    try {
      this.stream.write(message);
    } catch {
      // gone
    }
  }

  event(event: Roomr.SessionEvent) {
    this.send({ event });
  }

  /** The caller (or callee) pressed a key. */
  dtmf(digit: string, source = "rfc4733") {
    this.send({ dtmf: { digit, source } });
  }

  /** Ends the call: the stream gets Ended with the cause and closes (no Ended when `crash`). */
  end(cause: EndCause, sipStatus?: number) {
    if (this.ended) return;
    this.event({ ended: { cause, sipStatus: sipStatus ?? 0 } });
    this.ended = { cause, ...(sipStatus ? { sipStatus } : {}) };
    this.teardown();
    try {
      this.stream?.end();
    } catch {
      // gone
    }
    setTimeout(() => this.client?.close(), 200).unref?.();
    this.emit("ended", this.ended);
  }

  /** The node dies: the stream breaks with no Ended, RTP stops. */
  crash() {
    if (this.ended) return;
    this.ended = { cause: "node_error" };
    this.teardown();
    this.stream?.cancel();
    this.client?.close();
    this.emit("ended", this.ended);
  }

  private teardown() {
    clearTimeout(this.timer);
    clearTimeout(this.waitTimer);
    for (const f of [...this.callerForks, ...this.appForks]) f.close();
    this.listenerForks.clear();
    try {
      this.socket.close();
    } catch {
      // already closed
    }
  }

  // ---- app → node ---------------------------------------------------------------------

  private onGone() {
    if (this.ended) return;
    // A stream that breaks before the answer: 503 to the caller; after it: BYE. Either way the
    // call ends with app_gone (the node never reconnects a call).
    if (this.direction === "INBOUND" && !this.answered) this.sip.push(503);
    this.end("app_gone");
  }

  private onMessage(m: Roomr.AppMessage) {
    const type = Roomr.messageType(m, Roomr.APP_MESSAGE_TYPES);
    if (!type) return;
    const body = ((m as Record<string, unknown>)[type] ?? {}) as Record<
      string,
      unknown
    >;
    const recorded: RecordedCommand = {
      at: Date.now(),
      callRef: this.callRef,
      command: { type, ...body }
    };
    this.commands.push(recorded);
    this.node.commands.push(recorded);
    this.node.emit("command", recorded);
    if (this.ended) return;
    if (!this.answered) return this.beforeAnswer(type, body);
    this.node.handle(this, type, body);
  }

  private beforeAnswer(type: string, body: Record<string, unknown>) {
    switch (type) {
      case "answer":
      case "ready":
        // An inbound call is answered only by Answer; Ready (or Answer) takes an outbound one.
        if (type === "ready" && this.direction === "INBOUND") return;
        return this.take(body.media as Roomr.MediaEndpoint);
      case "reject": {
        let status = Number(body.sipStatus) || 603;
        if (status < 400 || status > 699) status = 603;
        if (this.direction === "INBOUND") this.sip.push(status);
        return this.end(
          this.direction === "INBOUND" ? "rejected" : "removed",
          status
        );
      }
      case "hangup": {
        let status = Number(body.sipStatus) || 480;
        if (status < 400 || status > 699) status = 480;
        if (this.direction === "INBOUND") this.sip.push(status);
        return this.end("removed", status);
      }
      default:
      // Commands before Answer or Ready are ignored, as the node does.
    }
  }

  private take(media: Roomr.MediaEndpoint | undefined) {
    if (!media?.ip || !media.port) {
      if (this.direction === "INBOUND") this.sip.push(500);
      return this.end("node_error", 500);
    }
    clearTimeout(this.waitTimer);
    this.appMedia = media;
    if (media.srtpKey && this.node.options.srtp) {
      this.outbound = this.node.options.srtp(this.nodeKey);
      this.inbound = this.node.options.srtp(media.srtpKey);
    }
    this.answered = true;
    if (this.direction === "INBOUND") this.sip.push(200);
    this.play(this.node.audioFor(this.node.options.callerAudio));
    // The call's SIP leg, then the app's leg, as the node announces them after the answer.
    this.event({
      participantJoined: { participantRef: this.callerRef, trackId: 1 }
    });
    this.event({
      participantJoined: { participantRef: this.appRef, trackId: 2 }
    });
    this.emit("answered");
  }

  // ---- RTP ----------------------------------------------------------------------------

  /** Sends caller audio at real-time pace, then silence, until the call ends. */
  private play(audio: Buffer) {
    this.pending = splitFrames(audio, FORMAT);
    const silence = encode(generate("silence", FRAME_MS, FORMAT.rate), FORMAT);
    const start = Date.now();
    let i = 0;
    const tick = () => {
      if (this.ended) return;
      const next = this.pending.shift();
      if (!this.silent) this.sendFrame(this.held ? silence : (next ?? silence));
      i++;
      this.timer = setTimeout(
        tick,
        Math.max(0, start + i * FRAME_MS - Date.now())
      );
    };
    tick();
  }

  /** The caller says something new from the next frame. */
  speak(audio: Buffer) {
    this.pending = splitFrames(audio, FORMAT);
  }

  private sendFrame(payload: Buffer) {
    const media = this.appMedia;
    if (!media) return;
    const packet = rtpPacket(this.seq, this.timestamp, this.ssrc, payload);
    this.seq = (this.seq + 1) & 0xffff;
    this.timestamp = (this.timestamp + SAMPLES_PER_FRAME) >>> 0;
    if (isAudible(payload, FORMAT)) this.sentAudible.push(Date.now());
    this.socket.send(
      this.outbound ? this.outbound.protect(packet) : packet,
      media.port,
      media.ip
    );
    for (const f of this.callerForks) f.send(payload);
  }

  private onPacket(raw: Buffer) {
    let msg: Buffer | undefined = raw;
    if (this.inbound) msg = this.inbound.unprotect(raw);
    if (!msg || msg.length < 12 || msg[0] >> 6 !== 2) return;
    let offset = 12 + (msg[0] & 0x0f) * 4;
    if (msg[0] & 0x10) offset += 4 + msg.readUInt16BE(offset + 2) * 4;
    const payload = msg.subarray(offset);
    for (const f of this.appForks) f.send(payload);
    this.received.push({
      at: Date.now(),
      ms: durationMs(payload.length, FORMAT),
      audible: isAudible(payload, FORMAT)
    });
  }

  // ---- listeners ----------------------------------------------------------------------

  attachListener(ref: string, listen: Roomr.ListenTrack[]) {
    const forks: Fork[] = [];
    for (const t of listen) {
      if (!t.rtp?.ip || !t.rtp.port) continue;
      const fork = new Fork({ host: t.rtp.ip, port: t.rtp.port });
      forks.push(fork);
      if (t.trackId === 1) this.callerForks.push(fork);
      else if (t.trackId === 2) this.appForks.push(fork);
      else fork.close();
    }
    this.listenerForks.set(ref, forks);
  }

  detachListener(ref: string) {
    const forks = this.listenerForks.get(ref);
    if (!forks) return;
    this.listenerForks.delete(ref);
    for (const f of forks) f.close();
    this.callerForks = this.callerForks.filter((f) => !f.closed);
    this.appForks = this.appForks.filter((f) => !f.closed);
  }
}

/**
 * Plays the Roomr node for AppBridge suites over the control stream. `offerCall` places an
 * inbound call, `placeCall` an answered outbound one; caller actions and measurements default to
 * the last call.
 */
export class FakeSessionNode extends EventEmitter {
  readonly nodeId: string;
  readonly commands: RecordedCommand[] = [];
  readonly calls: FakeSessionCall[] = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(readonly options: FakeSessionNodeOptions = {}) {
    super();
    this.nodeId = options.nodeId ?? `fake-node-${Date.now()}`;
  }

  configure(options: Partial<FakeSessionNodeOptions>) {
    Object.assign(this.options, options);
  }

  // ---- driving calls ------------------------------------------------------------------

  /**
   * An inbound call, as an INVITE through Routr would be: the caller hears 180, the node opens a
   * stream to the session endpoint with every INVITE header (X-App-Ref, X-Call-Ref, ...) in
   * Start.headers. Resolves once Start is sent.
   */
  async offerCall(
    call: {
      from?: string;
      to?: string;
      appRef?: string;
      callRef?: string;
      metadata?: Record<string, string>;
      /** More INVITE headers (e.g. X-Connect-Token). */
      headers?: Record<string, string>;
      roomRef?: string;
    } = {}
  ): Promise<FakeSessionCall> {
    const callRef = call.callRef ?? nextRef("call");
    const appRef = call.appRef ?? this.options.appRef;
    const c = new FakeSessionCall(
      this,
      callRef,
      call.roomRef ?? nextRef("room"),
      "INBOUND"
    );
    this.calls.push(c);
    c.sip.push(180);
    const media = await c.bind(this.options.host ?? "127.0.0.1");
    c.open(
      this.endpoint(),
      {
        callRef,
        direction: "INBOUND",
        from: call.from ?? "+15550001111",
        to: call.to ?? "+15550002222",
        headers: {
          ...(appRef ? { "X-App-Ref": appRef } : {}),
          ...(call.callRef ? { "X-Call-Ref": call.callRef } : {}),
          "X-Call-Direction": "inbound",
          ...(call.headers ?? {})
        },
        metadata: call.metadata ?? {},
        roomRef: c.roomRef,
        nodeRef: this.nodeId
      },
      media,
      this.options.keepaliveMs ?? 10_000
    );
    c.waitForApp(this.options.answerTimeoutMs ?? 10_000);
    return c;
  }

  /**
   * An outbound call the callee just answered (CreateCall from a controller): the node opens a
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
    const callRef = call.callRef ?? nextRef("call");
    const c = new FakeSessionCall(this, callRef, nextRef("room"), "OUTBOUND");
    this.calls.push(c);
    const media = await c.bind(this.options.host ?? "127.0.0.1");
    c.open(
      this.endpoint(),
      {
        callRef,
        direction: "OUTBOUND",
        from: call.from ?? "+15550001111",
        to: `sip:${call.to ?? "+15550002222"}@carrier`,
        headers: call.headers ?? {},
        metadata: {
          ...(call.appRef ? { app_ref: call.appRef } : {}),
          ...(call.metadata ?? {})
        },
        roomRef: c.roomRef,
        nodeRef: this.nodeId
      },
      media,
      this.options.keepaliveMs ?? 10_000
    );
    c.waitForApp(this.options.readyTimeoutMs ?? 10_000);
    return c;
  }

  private endpoint(): string {
    if (!this.options.endpoint)
      throw new Error("FakeSessionNode: no session endpoint configured");
    return this.options.endpoint;
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

  isHeld(callRef?: string): boolean {
    return this.call(callRef)?.held ?? false;
  }

  /** Listeners attached and not yet detached, over every call. */
  activeListeners(): number {
    return this.calls.reduce((n, c) => n + c.listenerForks.size, 0);
  }

  /** The caller speaks on every answered call. */
  callerSpeaks(source: AudioSource & { pcm16le?: Buffer }) {
    for (const c of this.calls) if (!c.ended) c.speak(this.audioFor(source));
  }

  /** The caller presses a key. */
  pressKey(digit: string, callRef?: string) {
    this.call(callRef)?.dtmf(digit);
  }

  /** The caller hangs up: its leg leaves, then Ended caller_hangup. */
  callerHangup(callRef?: string) {
    const c = this.call(callRef);
    if (!c || c.ended) return;
    if (c.answered)
      c.event({
        participantLeft: { participantRef: c.callerRef, cause: "caller_hangup" }
      });
    c.end("caller_hangup");
  }

  /** The dialed party of an outbound call hangs up. */
  calleeHangup(callRef?: string) {
    const c = this.call(callRef);
    if (!c || c.ended) return;
    c.event({
      participantLeft: { participantRef: c.callerRef, cause: "callee_hangup" }
    });
    c.end("callee_hangup");
  }

  /** The node ends a call itself (media timeout, maximum duration, ...). */
  endCall(cause: EndCause | string, sipStatus?: number, callRef?: string) {
    this.call(callRef)?.end(cause as EndCause, sipStatus);
  }

  /** Alias of endCall, for scenarios written against the NATS fake. */
  dropRoom(cause: EndCause | string, sipStatus?: number, callRef?: string) {
    this.endCall(cause, sipStatus, callRef);
  }

  /** The node dies: every stream breaks with no Ended and RTP stops. */
  crash() {
    for (const c of this.calls) c.crash();
  }

  /** The node's RTP to the app stops while the stream stays open. */
  stopMedia(callRef?: string) {
    const c = this.call(callRef);
    if (c) c.silent = true;
  }

  // ---- the node's side of the app's commands -----------------------------------------

  /** Runs one command the app sent after Answer or Ready. */
  handle(c: FakeSessionCall, type: string, body: Record<string, unknown>) {
    switch (type) {
      case "hold":
        c.held = true;
        return;
      case "resume":
        c.held = false;
        return;
      case "play":
        return this.later(
          () =>
            c.event({
              operationDone: {
                operationRef: String(body.operationRef ?? ""),
                status: "completed"
              }
            }),
          10
        );
      case "stop":
        return c.event({
          operationDone: {
            operationRef: String(body.operationRef ?? ""),
            status: "stopped"
          }
        });
      case "record":
        return c.event({
          operationDone: {
            operationRef: String(body.operationRef ?? ""),
            status: "failed",
            error: "not implemented: attach a listener to record"
          }
        });
      case "attachListener":
        return c.attachListener(
          String(body.listenerRef ?? ""),
          (body.listen as Roomr.ListenTrack[]) ?? []
        );
      case "detachListener":
        return c.detachListener(String(body.listenerRef ?? ""));
      case "transfer":
        return this.transfer(c, body);
      case "transferComplete": {
        if (!c.warmParty)
          return c.event({
            transferResult: { status: "failed", cause: "rejected" }
          });
        c.warmParty = undefined;
        c.held = false;
        c.event({ transferResult: { status: "completed" } });
        c.event({
          participantLeft: { participantRef: c.appRef, cause: "removed" }
        });
        return;
      }
      case "hangup":
        return c.end("removed");
      default:
      // sendDtmf, answer/ready/reject after the answer: nothing to do
    }
  }

  private transfer(c: FakeSessionCall, body: Record<string, unknown>) {
    const mode = String(body.mode ?? "cold");
    const outcome = this.options.dialOutcome ?? "answered";
    if (mode === "refer") {
      return this.later(() => {
        if (outcome !== "answered")
          return c.event({
            transferResult: { status: "failed", cause: "rejected" }
          });
        c.event({ transferResult: { status: "referred" } });
        c.end("removed");
      }, this.options.answerAfterMs ?? 50);
    }
    if (mode === "warm") c.held = true;
    this.later(() => {
      if (c.ended) return;
      if (outcome !== "answered") {
        if (mode === "warm") c.held = false;
        const cause = outcome === "failed" ? "rejected" : outcome;
        const sipStatus =
          outcome === "busy" ? 486 : outcome === "no_answer" ? 408 : 503;
        return c.event({
          transferResult: { status: "failed", cause, sipStatus }
        });
      }
      const party = nextRef("p-dialed");
      c.event({ participantJoined: { participantRef: party, trackId: 3 } });
      if (mode === "warm") {
        c.warmParty = party;
        return; // TransferComplete finishes it
      }
      c.event({
        participantLeft: { participantRef: c.appRef, cause: "removed" }
      });
      c.event({ transferResult: { status: "completed" } });
    }, this.options.answerAfterMs ?? 50);
  }

  // ---- measurements ------------------------------------------------------------------

  /** App audio packets received on every call, oldest first. */
  receivedAudio(): ReceivedPacket[] {
    return this.calls.flatMap((c) => c.received).sort((a, b) => a.at - b.at);
  }

  /** ms of audible app audio received since `since`. */
  outputAudioMs(since: number): number {
    return Math.round(
      this.receivedAudio()
        .filter((p) => p.at >= since && p.audible)
        .reduce((sum, p) => sum + p.ms, 0)
    );
  }

  /** When the first audible caller packet at or after `since` was sent, if one was. */
  firstCallerAudibleSentAt(since: number): number | undefined {
    const sent = this.calls
      .flatMap((c) => c.sentAudible)
      .filter((at) => at >= since);
    return sent.length ? Math.min(...sent) : undefined;
  }

  /** ms between `since` and the last audible packet after it (0 if none arrived). */
  outputSilentWithinMs(since: number): number {
    const audible = this.receivedAudio().filter(
      (p) => p.at >= since && p.audible
    );
    return audible.length ? audible[audible.length - 1].at - since : 0;
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
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    for (const c of this.calls) if (!c.ended) c.crash();
    this.removeAllListeners();
  }

  // ---- internals -------------------------------------------------------------------------

  private later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  /** Caller audio in the app leg's format (L16/16000). */
  audioFor(source?: AudioSource & { pcm16le?: Buffer }): Buffer {
    if (!source) return Buffer.alloc(0);
    if (source.kind === "file" || source.pcm16le) {
      const pcm = source.pcm16le ?? fs.readFileSync(source.file!);
      const samples = new Int16Array(pcm.length / 2);
      for (let i = 0; i < samples.length; i++)
        samples[i] = pcm.readInt16LE(i * 2);
      return encode(samples, FORMAT);
    }
    return encode(
      generate(source.kind ?? "tone", source.ms ?? 0, FORMAT.rate),
      FORMAT
    );
  }
}
