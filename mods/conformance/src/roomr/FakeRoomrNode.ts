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
import { Roomr } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { HealthImplementation } from "grpc-health-check";
import { NatsConnection, StringCodec } from "nats";
import { durationMs, NodeOverrides } from "./nodeConfig";
import {
  FRAME_MS,
  FRAME_SAMPLES,
  L16,
  l16Payload,
  l16Samples,
  rtpPacket,
  rtpPayload,
  wavSamples
} from "./rtp";
import { SipCallOptions } from "./sip";
import { VCall, VirtualNode, VirtualSip } from "./VirtualSip";
import { camelFields, refusal, snakeFields } from "./wire";

// The fake Roomr node (redesign-roomr 11.6): the node side of every Roomr contract, enough to
// run the same media-control scenario files as the Go node. It serves roomr.v1.Roomr and
// grpc.health.v1.Health, opens one control stream per call to the session endpoint (Start
// first, Dtmf and Event after), mixes each room (mix-minus at 16 kHz, hold with looped music,
// per-track listener forks), exchanges real RTP with app legs and RTP participants, publishes
// heartbeats and events on core NATS (best effort: nothing is published or buffered while the
// connection is down), registers with the registrar, and drains on SIGTERM. Its SIP legs are the
// VirtualSip's calls, so the caller, trunk and registrar are observable the same way as the
// caller bot's. Replaces FakeNatsRoomr's role (the NATS offer and command contract is retired).

const sc = StringCodec();

const ENDED_CAUSE = {
  callerHangup: "caller_hangup",
  calleeHangup: "callee_hangup",
  busy: "busy",
  noAnswer: "no_answer",
  rejected: "rejected",
  mediaTimeout: "media_timeout",
  nodeError: "node_error",
  maxDuration: "max_duration",
  removed: "removed",
  appGone: "app_gone"
} as const;

/** The node's default offer order, as rtpmap names. */
const CODECS = ["opus/48000", "G722/8000", "PCMU/8000", "PCMA/8000"];

/** Headers the node sets itself and refuses in to.headers and registration templates. */
const RESERVED_HEADERS = new Set([
  "via",
  "from",
  "to",
  "call-id",
  "cseq",
  "contact",
  "max-forwards",
  "route",
  "record-route",
  "authorization",
  "proxy-authorization",
  "expires",
  "v",
  "f",
  "t",
  "i",
  "m",
  "l",
  "c",
  "e",
  "k",
  "s"
]);

const DEDUPE_WINDOW_MS = 10 * 60_000;
const DIAL_TIMEOUT_MS = 60_000;
const WARM_TRANSFER_TIMEOUT_MS = 30_000;

/** Refs the node generates carry 128 random bits. */
const newRef = (prefix: string) =>
  `${prefix}-${randomBytes(16).toString("hex")}`;

/** One NATS subject token, printable, at most 128 characters (as the Go node's validRef). */
function validRef(s: string): boolean {
  return (
    !!s &&
    s.length <= 128 &&
    !/[. *>]/.test(s) &&
    [...s].every((c) => c.charCodeAt(0) > 0x20 && c.charCodeAt(0) !== 0x7f)
  );
}

function failCause(status: number): string {
  if (status === 486 || status === 600) return ENDED_CAUSE.busy;
  if (status === 408 || status === 480 || status === 487)
    return ENDED_CAUSE.noAnswer;
  return ENDED_CAUSE.rejected;
}

/** Pass-through header rule: SIP tokens, one line, none the node sets itself. */
function headersValid(headers: Record<string, string> = {}): boolean {
  return Object.entries(headers).every(
    ([k, v]) =>
      /^[A-Za-z0-9!%'*+\-.^_`|~]+$/.test(k) &&
      !RESERVED_HEADERS.has(k.toLowerCase()) &&
      !/^content-/i.test(k) &&
      !/[\r\n]/.test(String(v))
  );
}

function headerValue(
  headers: Record<string, string> | undefined,
  name?: string
) {
  if (!name || !headers) return undefined;
  const k = Object.keys(headers).find(
    (h) => h.toLowerCase() === name.toLowerCase()
  );
  return k === undefined ? undefined : String(headers[k]).trim();
}

function codecBase(name: string) {
  return name.split("/")[0].toLowerCase();
}

/** A UDP port of the node's: one RTP leg (app leg or RTP participant), L16/16000. */
class NodePort {
  private socket = dgram.createSocket("udp4");
  remote?: { ip: string; port: number };
  inbox: Int16Array[] = [];
  lastPacketAt = 0;
  port = 0;
  private seq = Math.floor(Math.random() * 0xffff);
  private ts = Math.floor(Math.random() * 0xffffffff);
  private readonly ssrc = Math.floor(Math.random() * 0xffffffff);
  private closed = false;

  constructor() {
    this.socket.on("error", () => undefined);
    this.socket.on("message", (msg) => {
      const payload = rtpPayload(msg);
      if (!payload) return;
      this.lastPacketAt = Date.now();
      this.inbox.push(l16Samples(payload));
      if (this.inbox.length > 10) this.inbox.shift();
    });
  }

  async bind(host: string) {
    await new Promise<void>((r) => this.socket.bind(0, host, () => r()));
    this.port = this.socket.address().port;
    return this;
  }

  send(samples: Int16Array) {
    if (this.closed || !this.remote) return;
    this.socket.send(
      rtpPacket(this.seq, this.ts, this.ssrc, l16Payload(samples)),
      this.remote.port,
      this.remote.ip
    );
    this.seq = (this.seq + 1) & 0xffff;
    this.ts = (this.ts + FRAME_SAMPLES) >>> 0;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.socket.close();
    } catch {
      // closed
    }
  }
}

type Kind = "phone" | "app" | "rtp";

class Part {
  trackId = 0;
  announced = false;
  since = Date.now();
  /** The frame this participant sent this tick. */
  frame?: Int16Array;
  constructor(
    readonly ref: string,
    readonly kind: Kind,
    readonly codec: string,
    readonly call?: Call,
    readonly leg?: VCall,
    readonly port?: NodePort
  ) {}

  pull(): Int16Array | undefined {
    if (this.leg) {
      const f = this.leg.pull();
      if (f) this.lastAt = Date.now();
      return f;
    }
    return this.port?.inbox.shift();
  }

  private lastAt = 0;
  silentFor(now: number) {
    const last = Math.max(
      this.leg ? this.lastAt : (this.port?.lastPacketAt ?? 0),
      this.since
    );
    return now - last;
  }

  deliver(samples: Int16Array) {
    if (this.leg) this.leg.push(samples);
    else this.port?.send(samples);
  }

  close() {
    this.port?.close();
  }
}

type Fork = { trackId: number; port: NodePort };

class Room {
  readonly parts = new Map<string, Part>();
  readonly calls = new Set<Call>();
  readonly held = new Map<string, { music?: Int16Array; pos: number }>();
  readonly listeners = new Map<string, Fork[]>();
  nextTrack = 0;
  seq = 0;
  ended = false;
  dialing = 0;
  idleSince = Date.now();
  maxParticipants: number;
  emptyTimeoutMs: number;
  maxDurationMs: number;

  constructor(
    readonly node: FakeRoomrNode,
    readonly ref: string,
    readonly implicit: boolean
  ) {
    this.maxParticipants = node.limits.maxParticipants;
    this.emptyTimeoutMs = node.limits.emptyRoomTimeoutMs;
    this.maxDurationMs = node.limits.maxDurationMs;
  }

  event(type: string, extra: Record<string, unknown> = {}) {
    this.seq++;
    this.node.publish(`roomr.events.room.${this.ref}`, {
      ...this.node.eventBase(type),
      ...extra,
      room_ref: this.ref,
      seq: this.seq
    });
  }

  add(p: Part): boolean {
    if (this.ended || this.parts.size >= this.maxParticipants) return false;
    p.trackId = ++this.nextTrack;
    this.parts.set(p.ref, p);
    return true;
  }

  participantEvent(
    p: Part,
    type: "participant.joined" | "participant.left",
    cause = ""
  ) {
    if (type === "participant.joined") {
      if (p.announced) return;
      p.announced = true;
    } else {
      if (!p.announced) return;
      p.announced = false;
    }
    const ev: Record<string, unknown> = {
      participant_ref: p.ref,
      track_id: p.trackId,
      kind: p.kind,
      tracks: [{ track_id: p.trackId, kind: "audio", codec: p.codec }],
      ...(cause ? { cause } : {})
    };
    if (!p.call || !p.call.event(type, ev)) this.event(type, ev);
    for (const c of this.calls)
      c.sendEvent(
        type === "participant.joined"
          ? { participantJoined: { participantRef: p.ref, trackId: p.trackId } }
          : { participantLeft: { participantRef: p.ref, cause } }
      );
  }

  /** Takes a participant out and reports it left. */
  remove(ref: string, cause: string): Part | undefined {
    const p = this.parts.get(ref);
    if (!p) return undefined;
    this.parts.delete(ref);
    this.held.delete(ref);
    if (this.parts.size === 0 && this.dialing === 0)
      this.idleSince = Date.now();
    p.close();
    this.participantEvent(p, "participant.left", cause);
    return p;
  }

  setHold(p: Part | undefined, held: boolean, music?: string) {
    if (!p) return;
    if (!held) {
      this.held.delete(p.ref);
      return;
    }
    const h: { music?: Int16Array; pos: number } = { pos: 0 };
    this.held.set(p.ref, h);
    if (!music) return;
    void fetch(music)
      .then((r) => (r.ok ? r.arrayBuffer() : undefined))
      .then((buf) => {
        const samples = buf && wavSamples(Buffer.from(buf));
        if (samples && this.held.get(p.ref) === h) h.music = samples;
      })
      .catch(() => undefined);
  }

  /** One 20 ms tick: everyone gets the mix of the others; the held get their music. */
  tick() {
    const parts = [...this.parts.values()];
    for (const p of parts) p.frame = p.pull();
    for (const p of parts) {
      const h = this.held.get(p.ref);
      let out = new Int16Array(FRAME_SAMPLES);
      if (h) {
        if (h.music?.length) {
          for (let i = 0; i < FRAME_SAMPLES; i++)
            out[i] = h.music[(h.pos + i) % h.music.length];
          h.pos = (h.pos + FRAME_SAMPLES) % h.music.length;
        }
      } else {
        const sum = new Int32Array(FRAME_SAMPLES);
        for (const q of parts) {
          if (q === p || !q.frame || this.held.has(q.ref)) continue;
          for (let i = 0; i < FRAME_SAMPLES && i < q.frame.length; i++)
            sum[i] += q.frame[i];
        }
        out = Int16Array.from(sum, (v) => Math.max(-32768, Math.min(32767, v)));
      }
      p.deliver(out);
    }
    for (const forks of this.listeners.values())
      for (const f of forks) {
        const src = parts.find((p) => p.trackId === f.trackId);
        if (src?.frame) f.port.send(src.frame);
      }
  }

  end(cause: string, status = 0) {
    if (this.ended) return;
    this.ended = true;
    for (const c of [...this.calls]) c.end(cause, status);
    for (const p of [...this.parts.values()])
      this.remove(p.ref, p.kind === "rtp" ? ENDED_CAUSE.removed : cause);
    for (const forks of this.listeners.values())
      for (const f of forks) f.port.close();
    this.listeners.clear();
    this.event("room.ended", {
      cause,
      ...(status ? { sip_status: status } : {})
    });
    this.node.roomEnded(this);
  }
}

type CallRequest = Record<string, unknown> & {
  callRef: string;
  to: {
    uri: string;
    proxy?: string;
    headers?: Record<string, string>;
    auth?: { username: string; password: string };
  };
};

class Call {
  state: "RINGING" | "ANSWERED" | "ENDED" = "RINGING";
  room?: Room;
  roomRef = "";
  leg?: Part;
  app?: Part;
  parties: Part[] = [];
  warm?: Part;
  metadata: Record<string, string> = {};
  headers: Record<string, string> = {};
  from = "";
  to = "";
  endpoint = "";
  request?: CallRequest;
  seq = 0;
  evClosed = false;
  ending = false;
  endedAt = 0;
  answeredAt = 0;
  maxDurationMs: number;
  reserved = false;
  removed = false;
  transferred = false;
  dialAbort?: AbortController;
  dialRoom?: Room;
  stream?: Roomr.SessionClientStream;
  client?: grpc.Client;
  appPort?: NodePort;
  /** Resolves the wait for Answer/Ready; the stream's messages go here first. */
  private waiter?: (m: Roomr.AppMessage | "gone") => void;
  private streamGone = false;

  constructor(
    readonly node: FakeRoomrNode,
    readonly ref: string,
    readonly inbound: boolean
  ) {
    this.maxDurationMs = node.limits.maxDurationMs;
  }

  info() {
    return {
      callRef: this.ref,
      roomRef: this.roomRef,
      state: this.state,
      participantRef: this.leg?.ref ?? ""
    };
  }

  event(type: string, extra: Record<string, unknown> = {}): boolean {
    if (this.evClosed) return false;
    this.seq++;
    if (type === "call.ended") this.evClosed = true;
    this.node.publish(`roomr.events.${this.ref}`, {
      ...this.node.eventBase(type),
      ...extra,
      call_ref: this.ref,
      room_ref: this.roomRef,
      seq: this.seq,
      metadata: this.metadata
    });
    return true;
  }

  send(message: Roomr.NodeMessage) {
    if (!this.stream || this.streamGone) return;
    try {
      this.stream.write(message);
    } catch {
      // gone
    }
  }

  sendEvent(event: Roomr.SessionEvent) {
    this.send({ event });
  }

  lowerMax(seconds?: number) {
    const s = Number(seconds ?? 0);
    if (s > 0 && s * 1000 < this.maxDurationMs) this.maxDurationMs = s * 1000;
  }

  /** Opens the control stream and sends Start; false when the endpoint cannot be reached. */
  async openStream(): Promise<boolean> {
    this.appPort = await new NodePort().bind(this.node.host);
    if (this.ending) return false;
    const Client = Roomr.sessionClient();
    this.client = new Client(this.endpoint, grpc.credentials.createInsecure(), {
      "grpc.keepalive_time_ms": 10_000,
      "grpc.keepalive_timeout_ms": 20_000,
      "grpc.keepalive_permit_without_calls": 1
    });
    const stream = (
      this.client as unknown as { Connect(): Roomr.SessionClientStream }
    ).Connect();
    this.stream = stream;
    const gone = () => {
      if (this.streamGone) return;
      this.streamGone = true;
      this.onMessage("gone");
    };
    stream.on("data", (m: Roomr.AppMessage) => this.onMessage(m));
    stream.on("error", gone);
    stream.on("end", gone);
    // Start goes out as soon as the connection is up; an endpoint that refuses connections
    // fails the stream (`gone` before any answer: 503 inbound, app_gone outbound).
    stream.write({
      start: {
        callRef: this.ref,
        direction: this.inbound ? "INBOUND" : "OUTBOUND",
        from: this.from,
        to: this.to,
        headers: this.headers,
        metadata: this.metadata,
        roomRef: this.roomRef,
        nodeRef: this.node.nodeRef,
        media: {
          ip: this.node.host,
          port: this.appPort.port,
          codec: L16,
          srtpKey: randomBytes(30).toString("base64")
        }
      }
    } as Roomr.NodeMessage);
    return true;
  }

  private queue: (Roomr.AppMessage | "gone")[] = [];

  private onMessage(m: Roomr.AppMessage | "gone") {
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = undefined;
      return w(m);
    }
    if (this.state === "ANSWERED") return this.handle(m);
    this.queue.push(m);
  }

  /** The next stream message, or "timeout" after `ms`. */
  next(ms: number): Promise<Roomr.AppMessage | "gone" | "timeout"> {
    const queued = this.queue.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        this.waiter = undefined;
        resolve("timeout");
      }, ms);
      this.waiter = (m) => {
        clearTimeout(t);
        resolve(m);
      };
    });
  }

  /** Waits for Answer (inbound) or Ready (outbound); ends the call when none comes. */
  async awaitApp(): Promise<boolean> {
    const limit = this.inbound
      ? this.node.limits.answerTimeoutMs
      : this.node.limits.readyTimeoutMs;
    const deadline = Date.now() + limit;
    for (;;) {
      if (this.ending) return false;
      const m = await this.next(Math.max(0, deadline - Date.now()));
      if (this.ending) return false;
      if (m === "timeout") {
        this.end(ENDED_CAUSE.appGone, this.inbound ? 480 : 0);
        return false;
      }
      if (m === "gone") {
        this.end(ENDED_CAUSE.appGone, this.inbound ? 503 : 0);
        return false;
      }
      const type = Roomr.messageType(
        m as Record<string, unknown>,
        Roomr.APP_MESSAGE_TYPES
      );
      const body = ((m as Record<string, unknown>)[type ?? ""] ?? {}) as Record<
        string,
        unknown
      >;
      if (type === "answer" || (type === "ready" && !this.inbound)) {
        if (type === "answer") this.lowerMax(Number(body.maxDurationS ?? 0));
        return this.attachApp(body.media as Roomr.MediaEndpoint);
      }
      if (type === "reject" || type === "hangup") {
        let status = Number(body.sipStatus ?? 0);
        if (!this.inbound) {
          this.end(ENDED_CAUSE.removed, 0);
          return false;
        }
        if (status < 400 || status > 699)
          status = type === "reject" ? 603 : 480;
        this.end(
          type === "reject" ? ENDED_CAUSE.rejected : ENDED_CAUSE.removed,
          status
        );
        return false;
      }
      // Commands before Answer or Ready are ignored.
    }
  }

  private attachApp(media?: Roomr.MediaEndpoint): boolean {
    if (!media?.ip || !media.port || !this.room || !this.appPort) {
      this.end(ENDED_CAUSE.nodeError, this.inbound ? 500 : 0);
      return false;
    }
    this.appPort.remote = { ip: media.ip, port: Number(media.port) };
    const p = new Part(
      newRef("p-app"),
      "app",
      L16,
      this,
      undefined,
      this.appPort
    );
    if (!this.room.add(p)) {
      this.end(ENDED_CAUSE.nodeError, this.inbound ? 500 : 0);
      return false;
    }
    this.app = p;
    if (this.inbound) this.leg?.leg?.respond(200);
    this.state = "ANSWERED";
    this.answeredAt = Date.now();
    if (this.leg) this.leg.since = this.answeredAt;
    p.since = this.answeredAt;
    this.event("call.answered", { participant_ref: this.leg?.ref });
    if (this.leg) this.room.participantEvent(this.leg, "participant.joined");
    this.room.participantEvent(p, "participant.joined");
    for (const m of this.queue.splice(0)) this.handle(m);
    return true;
  }

  /** One app message after the answer, in order. */
  handle(m: Roomr.AppMessage | "gone") {
    if (this.ending) return;
    if (m === "gone") {
      if (this.transferred) return;
      return this.end(ENDED_CAUSE.appGone, 0);
    }
    const room = this.room;
    const type = Roomr.messageType(
      m as Record<string, unknown>,
      Roomr.APP_MESSAGE_TYPES
    );
    const body = ((m as Record<string, unknown>)[type ?? ""] ?? {}) as Record<
      string,
      unknown
    >;
    if (!room || !this.leg) return;
    switch (type) {
      case "hold":
        return room.setHold(this.leg, true, String(body.music ?? ""));
      case "resume":
        return room.setHold(this.leg, false);
      case "sendDtmf": {
        const digits = String(body.digits ?? "");
        if (/^[0-9A-D*#]+$/.test(digits) && this.leg.leg)
          this.leg.leg.digits += digits;
        return;
      }
      case "addListener":
        return void this.node.addListener(
          room,
          String(body.listenerRef ?? ""),
          body.listen as Roomr.ListenTrack[]
        );
      case "removeListener":
        return this.node.removeListener(room, String(body.listenerRef ?? ""));
      case "transfer":
        return void this.transfer(body);
      case "transferComplete":
        return this.completeTransfer();
      case "hangup":
        return this.end(ENDED_CAUSE.removed, 0);
      default:
      // Answer, Ready and Reject after the answer change nothing.
    }
  }

  private transferResult(status: string, cause = "", sipStatus = 0) {
    this.sendEvent({ transferResult: { status, cause, sipStatus } });
  }

  private async transfer(body: Record<string, unknown>) {
    const room = this.room!;
    const to = (body.to ?? {}) as CallRequest["to"];
    const mode = String(body.mode ?? "cold");
    if (mode === "refer") {
      setTimeout(() => {
        if (this.ending) return;
        if (!this.node.sip.refer(String(to.uri ?? "")))
          return this.transferResult("failed", ENDED_CAUSE.rejected);
        this.transferResult("referred");
        this.end(ENDED_CAUSE.removed, 0);
      }, 20);
      return;
    }
    if (!to.uri || !headersValid(to.headers))
      return this.transferResult("failed", ENDED_CAUSE.rejected);
    const warm = mode === "warm";
    let timeout = warm ? WARM_TRANSFER_TIMEOUT_MS : DIAL_TIMEOUT_MS;
    const ring = Number(body.ringTimeoutS ?? 0);
    if (ring > 0 && ring * 1000 < timeout) timeout = ring * 1000;
    if (warm) room.setHold(this.leg, true, String(body.music ?? ""));
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeout);
    const outcome = await this.node.dial(to, abort.signal);
    clearTimeout(timer);
    if (this.ending) {
      outcome.call?.bye();
      return;
    }
    if (!outcome.call) {
      if (warm) room.setHold(this.leg, false);
      const status = outcome.status === 487 ? 408 : outcome.status;
      return this.transferResult("failed", failCause(status), status);
    }
    const p = new Part(
      newRef("p-dialed"),
      "phone",
      outcome.call.codec ?? "PCMU/8000",
      this,
      outcome.call
    );
    p.since = Date.now();
    if (!room.add(p)) {
      outcome.call.bye();
      if (warm) room.setHold(this.leg, false);
      return this.transferResult("failed", ENDED_CAUSE.rejected);
    }
    outcome.call.onBye = () => {
      room.remove(p.ref, ENDED_CAUSE.calleeHangup);
      this.partyLeft(p);
    };
    this.parties.push(p);
    room.participantEvent(p, "participant.joined");
    if (warm) {
      this.warm = p;
      return;
    }
    this.transferred = true;
    if (this.app) this.removeApp();
    this.transferResult("completed");
  }

  private removeApp() {
    const app = this.app;
    this.app = undefined;
    if (app) this.room?.remove(app.ref, ENDED_CAUSE.removed);
  }

  private completeTransfer() {
    const warm = this.warm;
    this.warm = undefined;
    if (!warm) return this.transferResult("failed", ENDED_CAUSE.rejected);
    this.transferred = true;
    this.room?.setHold(this.leg, false);
    this.transferResult("completed");
    this.removeApp();
  }

  /** A transfer's party left: the call ends once nobody but the caller is left. */
  partyLeft(p: Part) {
    this.parties = this.parties.filter((q) => q !== p);
    if (this.warm === p) this.warm = undefined;
    if (!this.app && this.parties.length === 0)
      this.end(ENDED_CAUSE.calleeHangup, 0);
  }

  /** Ends the call once (as the Go node's call.end). */
  end(cause: string, status = 0) {
    if (this.ending) return;
    this.ending = true;
    const answered = this.answeredAt > 0;
    this.state = "ENDED";
    this.endedAt = Date.now();
    this.dialAbort?.abort();
    const leg = this.leg?.leg;
    if (leg && leg.state !== "ended") {
      if (this.inbound && leg.state === "calling") {
        if (cause !== ENDED_CAUSE.callerHangup) {
          const st = status >= 300 && status <= 699 ? status : 480;
          leg.respond(st);
        }
      } else leg.bye();
    }
    const room = this.room;
    if (room) {
      for (const p of [this.leg, this.app, ...this.parties]) {
        if (!p) continue;
        p.leg?.bye();
        room.remove(p.ref, cause);
      }
    }
    if (!this.app || !room) this.appPort?.close();
    this.event("call.ended", {
      cause,
      answered,
      ...(status ? { sip_status: status } : {})
    });
    if (this.stream && !this.streamGone) {
      this.sendEvent({ ended: { cause, sipStatus: status } });
      try {
        this.stream.end();
      } catch {
        // gone
      }
    }
    const client = this.client;
    if (client) setTimeout(() => client.close(), 200).unref?.();
    if (this.reserved) {
      this.reserved = false;
      this.node.release();
    }
    if (room) {
      room.calls.delete(this);
      if (room.calls.size === 0 && room.implicit) room.end(cause, status);
    }
    this.node.callEnded();
  }

  /** The node dies: the stream breaks with no Ended. */
  crash() {
    this.ending = true;
    this.state = "ENDED";
    this.stream?.cancel();
    this.client?.close();
    this.appPort?.close();
  }
}

export type FakeRoomrNodeOptions = {
  nodeRef?: string;
  /** Heartbeats and events (through the suite's NATS fault proxy). */
  nc?: NatsConnection;
  sessionEndpoint: string;
  sip: VirtualSip;
  overrides?: NodeOverrides;
  host?: string;
};

export class FakeRoomrNode implements VirtualNode {
  readonly nodeRef: string;
  readonly host: string;
  readonly sip: VirtualSip;
  readonly sipAddr: string;
  controlAddr = "";
  readonly limits: {
    maxRooms: number;
    maxParticipants: number;
    maxDurationMs: number;
    mediaTimeoutMs: number;
    answerTimeoutMs: number;
    readyTimeoutMs: number;
    emptyRoomTimeoutMs: number;
    drainWaitMs: number;
    heartbeatMs: number;
    reregisterDelta: number;
  };
  private readonly overrides: NodeOverrides;
  private readonly codecs: string[];
  private rooms = new Map<string, Room>();
  private calls = new Map<string, Call>();
  private reserved = 0;
  private server?: grpc.Server;
  private health = new HealthImplementation({ "": "SERVING" });
  private clock?: ReturnType<typeof setInterval>;
  private beat?: ReturnType<typeof setInterval>;
  private reregister?: ReturnType<typeof setInterval>;
  private natsUp = true;
  private dead = false;
  private draining = false;
  private registeredAt = 0;
  /** Set once the node exited (after a drain, or killed). */
  exited = false;

  constructor(private readonly options: FakeRoomrNodeOptions) {
    this.nodeRef =
      options.nodeRef ??
      `fake-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    this.host = options.host ?? "127.0.0.1";
    this.sip = options.sip;
    this.sipAddr = `fake:${this.nodeRef}`;
    const o = (this.overrides = options.overrides ?? {});
    this.limits = {
      maxRooms: o.maxRooms ?? 200,
      maxParticipants: o.maxParticipants ?? 10,
      maxDurationMs: durationMs(o.maxDuration, 4 * 3_600_000),
      mediaTimeoutMs: durationMs(o.mediaTimeout, 15_000),
      answerTimeoutMs: durationMs(o.answerTimeout, 10_000),
      readyTimeoutMs: durationMs(o.readyTimeout, 10_000),
      emptyRoomTimeoutMs: durationMs(o.emptyRoomTimeout, 30_000),
      drainWaitMs: durationMs(o.drainWait, 3_600_000),
      heartbeatMs: durationMs(o.heartbeatInterval, 2000),
      reregisterDelta: o.reregisterDelta ?? 5
    };
    const named = (o.codecs ?? ["opus", "G722", "PCMU", "PCMA"]).map((c) =>
      c.toLowerCase()
    );
    this.codecs = CODECS.filter((c) => named.includes(codecBase(c)));
  }

  // ---- lifecycle ------------------------------------------------------------------------

  async start(): Promise<this> {
    const server = new grpc.Server();
    server.addService(Roomr.roomrService(), this.handlers());
    this.health.addToServer(server);
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        `${this.host}:0`,
        grpc.ServerCredentials.createInsecure(),
        (err, p) => (err ? reject(err) : resolve(p))
      )
    );
    this.server = server;
    this.controlAddr = `${this.host}:${port}`;
    this.sip.nodes.set(this.sipAddr, this);
    this.watchNats();
    this.clock = setInterval(() => this.tick(), FRAME_MS);
    this.heartbeat();
    this.beat = setInterval(() => this.heartbeat(), this.limits.heartbeatMs);
    this.register(false);
    const regs = this.overrides.registrations ?? [];
    if (regs.length) {
      const half = Math.max(
        500,
        (durationMs(regs[0].expires, 30_000) || 30_000) / 2
      );
      this.reregister = setInterval(() => this.register(false), half);
    }
    return this;
  }

  private watchNats() {
    const nc = this.options.nc;
    if (!nc) return;
    void (async () => {
      for await (const s of nc.status()) {
        if (s.type === "disconnect" || s.type === "reconnecting")
          this.natsUp = false;
        if (s.type === "reconnect") this.natsUp = true;
      }
    })().catch(() => undefined);
  }

  /** Publishes on core NATS, best effort: nothing while the connection is down. */
  publish(subject: string, body: Record<string, unknown>) {
    const nc = this.options.nc;
    if (this.dead || !nc || !this.natsUp || nc.isClosed()) return;
    try {
      nc.publish(subject, sc.encode(JSON.stringify(body)));
    } catch {
      // dropped
    }
  }

  eventBase(type: string) {
    return { type, node_ref: this.nodeRef, ts: new Date().toISOString() };
  }

  private load() {
    return this.rooms.size + this.reserved;
  }

  private heartbeat() {
    let participants = 0;
    for (const r of this.rooms.values()) participants += r.parts.size;
    this.publish(`roomr.nodes.${this.nodeRef}.heartbeat`, {
      type: "node.heartbeat",
      node_ref: this.nodeRef,
      rooms: this.rooms.size,
      participants,
      max_rooms: this.limits.maxRooms,
      codecs: this.codecs,
      version: "fake",
      region: this.overrides.region ?? "",
      control_addr: this.controlAddr,
      sip_addr: this.sipAddr
    });
  }

  /** Registers (or unregisters) with every configured registration. */
  private register(unregister: boolean) {
    for (const r of this.overrides.registrations ?? []) {
      const headers = Object.fromEntries(
        Object.entries(r.headers ?? {}).map(([k, v]) => [
          k,
          String(v).replace(/\{sessions\}/g, String(this.rooms.size))
        ])
      );
      const expires = unregister
        ? "0"
        : String(Math.round(durationMs(r.expires, 30_000) / 1000) || 30);
      const ok = this.sip.register({
        aor: r.aor ?? "sip:roomr@registrar.fake",
        expires,
        headers,
        auth: r.auth
      });
      this.publish(`roomr.nodes.${this.nodeRef}.events`, {
        ...this.eventBase("registration.state"),
        registrar: this.sip.registrar,
        aor: r.aor ?? "sip:roomr@registrar.fake",
        state: unregister ? "unregistered" : ok ? "registered" : "failed"
      });
    }
    this.registeredAt = this.rooms.size;
  }

  private roomsChanged() {
    const delta = Math.abs(this.rooms.size - this.registeredAt);
    if (
      !this.draining &&
      (this.overrides.registrations?.length ?? 0) > 0 &&
      (delta >= this.limits.reregisterDelta ||
        (this.rooms.size === 0 && this.registeredAt !== 0))
    )
      this.register(false);
  }

  /** SIGTERM: NOT_SERVING, unregister, node.down, no more heartbeats; exit after the rooms. */
  sigterm() {
    if (this.draining || this.dead) return;
    this.draining = true;
    this.health.setStatus("", "NOT_SERVING");
    this.register(true);
    clearInterval(this.beat);
    clearInterval(this.reregister);
    this.publish(`roomr.nodes.${this.nodeRef}.heartbeat`, {
      type: "node.down",
      node_ref: this.nodeRef
    });
    const deadline = setTimeout(() => {
      for (const r of [...this.rooms.values()]) r.end(ENDED_CAUSE.nodeError);
      void this.exit();
    }, this.limits.drainWaitMs);
    const check = setInterval(() => {
      const live = [...this.calls.values()].some((c) => !c.ending);
      if (this.rooms.size === 0 && !live) {
        clearTimeout(deadline);
        clearInterval(check);
        void this.exit();
      }
    }, 50);
  }

  private async exit() {
    if (this.exited) return;
    this.exited = true;
    clearInterval(this.clock);
    clearInterval(this.beat);
    clearInterval(this.reregister);
    this.server?.forceShutdown();
    this.dead = true;
    this.sip.nodes.delete(this.sipAddr);
  }

  /** Dies without a word: no Ended, no node.down, no more heartbeats, RTP stops. */
  kill() {
    if (this.dead) return;
    this.dead = true;
    this.exited = true;
    clearInterval(this.clock);
    clearInterval(this.beat);
    clearInterval(this.reregister);
    for (const c of this.calls.values()) c.crash();
    for (const r of this.rooms.values()) {
      for (const p of r.parts.values()) p.close();
      for (const fs of r.listeners.values()) for (const f of fs) f.port.close();
    }
    this.server?.forceShutdown();
    this.sip.nodes.delete(this.sipAddr);
  }

  async stop() {
    this.kill();
  }

  // ---- the mixer clock ------------------------------------------------------------------

  private tick() {
    const now = Date.now();
    for (const r of [...this.rooms.values()]) {
      r.tick();
      if (
        !r.implicit &&
        r.parts.size === 0 &&
        r.dialing === 0 &&
        r.emptyTimeoutMs > 0 &&
        now - r.idleSince > r.emptyTimeoutMs
      )
        r.end(ENDED_CAUSE.nodeError);
    }
    for (const c of [...this.calls.values()]) {
      if (c.state !== "ANSWERED" || c.ending) continue;
      if (now - c.answeredAt > c.maxDurationMs) c.end(ENDED_CAUSE.maxDuration);
      else if (c.leg && c.leg.silentFor(now) > this.limits.mediaTimeoutMs)
        c.end(ENDED_CAUSE.mediaTimeout);
      else if (c.app && c.app.silentFor(now) > this.limits.mediaTimeoutMs)
        c.end(ENDED_CAUSE.appGone);
    }
    // Forget calls past the dedupe window.
    for (const [ref, c] of this.calls)
      if (c.ending && now - c.endedAt > DEDUPE_WINDOW_MS)
        this.calls.delete(ref);
  }

  roomEnded(r: Room) {
    this.rooms.delete(r.ref);
    this.roomsChanged();
  }

  callEnded() {
    // Calls stay known for the dedupe window; nothing to do.
  }

  release() {
    this.reserved = Math.max(0, this.reserved - 1);
  }

  private openRoom(ref: string, implicit: boolean): Room | "full" | "exists" {
    if (ref && this.rooms.has(ref)) return "exists";
    if (this.load() >= this.limits.maxRooms) return "full";
    const r = new Room(this, ref || newRef("room"), implicit);
    this.rooms.set(r.ref, r);
    this.roomsChanged();
    return r;
  }

  /** Dials through the trunk, answering one digest challenge with the target's auth. */
  async dial(to: CallRequest["to"], signal: AbortSignal) {
    let outcome = await this.sip.dial({
      uri: to.uri,
      headers: to.headers,
      signal
    });
    if ((outcome.status === 401 || outcome.status === 407) && to.auth?.password)
      outcome = await this.sip.dial({
        uri: to.uri,
        headers: to.headers,
        auth: to.auth,
        signal
      });
    if (outcome.call) outcome.call.codec = this.codecs[0] ?? "PCMU/8000";
    return outcome;
  }

  async addListener(
    room: Room,
    ref: string,
    listen: Roomr.ListenTrack[] = []
  ): Promise<string> {
    const forks: Fork[] = [];
    for (const t of listen) {
      if (!t.rtp?.ip || !t.rtp.port) continue;
      const port = await new NodePort().bind(this.host);
      port.remote = { ip: t.rtp.ip, port: Number(t.rtp.port) };
      forks.push({ trackId: Number(t.trackId), port });
    }
    const id = ref || newRef("p-listener");
    room.listeners.set(id, forks);
    return id;
  }

  removeListener(room: Room, ref: string): boolean {
    const forks = room.listeners.get(ref);
    if (!forks) return false;
    room.listeners.delete(ref);
    for (const f of forks) f.port.close();
    return true;
  }

  // ---- inbound --------------------------------------------------------------------------

  invite(leg: VCall, options: SipCallOptions) {
    void this.incoming(leg, options);
  }

  private async incoming(leg: VCall, options: SipCallOptions) {
    if (this.dead) return leg.respond(503);
    const offered = (
      options.codecs?.length ? options.codecs : ["PCMU/8000"]
    ).map(codecBase);
    const codec = this.codecs.find((c) => offered.includes(codecBase(c)));
    if (!codec) return leg.respond(488);
    leg.codec = codec;
    const headers = { ...(options.headers ?? {}) };
    const roomHeader = headerValue(headers, this.overrides.roomHeader);
    let room: Room | undefined;
    if (roomHeader && validRef(roomHeader)) room = this.rooms.get(roomHeader);
    if (!room) {
      const opened = this.openRoom(
        roomHeader && validRef(roomHeader) ? roomHeader : "",
        true
      );
      if (typeof opened === "string") return leg.respond(503);
      room = opened;
    }
    const wanted = headerValue(headers, this.overrides.callRefHeader);
    let ref =
      wanted && validRef(wanted) && !this.calls.has(wanted)
        ? wanted
        : newRef("call");
    while (this.calls.has(ref)) ref = newRef("call");
    const c = new Call(this, ref, true);
    c.from = options.from ?? "+15550001111";
    c.to = options.to ?? "+15550002222";
    c.headers = headers;
    c.endpoint = this.options.sessionEndpoint;
    c.room = room;
    c.roomRef = room.ref;
    const p = new Part(newRef("p-caller"), "phone", codec, c, leg);
    c.leg = p;
    this.calls.set(ref, c);
    c.event("call.started", {
      direction: "inbound",
      from: c.from,
      to: c.to,
      participant_ref: p.ref
    });
    room.calls.add(c);
    if (!room.add(p)) {
      c.leg = undefined;
      leg.respond(486);
      return c.end(ENDED_CAUSE.nodeError, 486);
    }
    leg.respond(180);
    c.event("call.ringing", { participant_ref: p.ref });
    leg.onCancel = () => c.end(ENDED_CAUSE.callerHangup, 487);
    leg.onBye = () => c.end(ENDED_CAUSE.callerHangup, 0);
    leg.onDtmf = (digit) => c.send({ dtmf: { digit, source: "rfc4733" } });
    if (!(await c.openStream())) return c.end(ENDED_CAUSE.appGone, 503);
    await c.awaitApp();
  }

  // ---- outbound -------------------------------------------------------------------------

  private async runOutbound(c: Call) {
    c.event("call.ringing");
    const abort = (c.dialAbort = new AbortController());
    const ring = Number(c.request?.ringTimeoutS ?? 0);
    const timer = setTimeout(
      () => abort.abort(),
      ring > 0 ? ring * 1000 : DIAL_TIMEOUT_MS
    );
    const outcome = await this.dial(c.request!.to, abort.signal);
    clearTimeout(timer);
    c.dialAbort = undefined;
    const dialRoom = c.dialRoom;
    c.dialRoom = undefined;
    if (dialRoom) dialRoom.dialing--;
    if (c.ending) {
      outcome.call?.bye();
      return;
    }
    if (!outcome.call) {
      let status = outcome.status === 487 && !c.removed ? 408 : outcome.status;
      let cause = failCause(status);
      if (c.removed) [cause, status] = [ENDED_CAUSE.removed, 0];
      c.end(cause, status);
      if (
        dialRoom &&
        dialRoom.parts.size === 0 &&
        dialRoom.dialing === 0 &&
        !dialRoom.implicit
      )
        dialRoom.end(cause, status);
      return;
    }
    let room = this.rooms.get(c.roomRef);
    if (!room) {
      if (c.reserved) {
        c.reserved = false;
        this.release();
      }
      const opened = this.openRoom(c.roomRef, true);
      if (typeof opened === "string") {
        outcome.call.bye();
        return c.end(ENDED_CAUSE.nodeError);
      }
      room = opened;
    }
    c.room = room;
    room.calls.add(c);
    const p = new Part(
      newRef("p-callee"),
      "phone",
      outcome.call.codec ?? "PCMU/8000",
      c,
      outcome.call
    );
    if (!room.add(p)) {
      outcome.call.bye();
      return c.end(ENDED_CAUSE.nodeError);
    }
    // The callee answered (call.ended reports answered from here on); the call is ANSWERED for
    // Roomr once the app's Ready brings up its leg.
    c.leg = p;
    c.answeredAt = Date.now();
    p.since = c.answeredAt;
    outcome.call.onBye = () => c.end(ENDED_CAUSE.calleeHangup, 0);
    outcome.call.onDtmf = (digit) =>
      c.send({ dtmf: { digit, source: "rfc4733" } });
    if (c.removed) return c.end(ENDED_CAUSE.removed);
    if (!(await c.openStream())) return c.end(ENDED_CAUSE.appGone);
    await c.awaitApp();
  }

  // ---- Roomr ----------------------------------------------------------------------------

  private handlers(): grpc.UntypedServiceImplementation {
    type Cb = grpc.sendUnaryData<unknown>;
    const unary =
      (fn: (req: Record<string, unknown>) => unknown | Promise<unknown>) =>
      (
        call: grpc.ServerUnaryCall<Record<string, unknown>, unknown>,
        cb: Cb
      ) => {
        Promise.resolve()
          .then(() => fn(call.request))
          .then((res) => cb(null, res))
          .catch((e: unknown) =>
            cb(
              (e as grpc.ServiceError).code !== undefined
                ? (e as grpc.ServiceError)
                : refusal(grpc.status.INTERNAL, "internal", String(e))
            )
          );
      };
    const bad = (msg: string) =>
      refusal(grpc.status.INVALID_ARGUMENT, "bad_message", msg);
    return {
      CreateCall: unary((raw) => {
        const req = raw as unknown as CallRequest;
        const to = req.to ?? ({ uri: "" } as CallRequest["to"]);
        if (!to.uri?.trim()) throw bad("to.uri is required");
        if (/[\r\n]/.test(to.uri + (to.proxy ?? "")))
          throw bad("to.uri and to.proxy must be one line");
        if (!headersValid(to.headers)) throw bad("bad header");
        const fromHeader = headerValue(
          to.headers,
          this.overrides.callRefHeader
        );
        let callRef = String(req.callRef ?? "");
        if (fromHeader !== undefined) {
          if (!validRef(fromHeader)) throw bad("bad call-ref header");
          if (callRef && callRef !== fromHeader)
            throw bad("call_ref and the call-ref header differ");
          callRef = fromHeader;
        }
        if (callRef && !validRef(callRef)) throw bad("bad call_ref");
        const roomRef = String(req.roomRef ?? "");
        if (roomRef && !validRef(roomRef)) throw bad("bad room_ref");
        callRef ||= newRef("call");
        const fingerprint = JSON.stringify({
          ...camelFields(snakeFields(req)),
          callRef
        });
        const known = this.calls.get(callRef);
        if (known) {
          if (known.inbound || JSON.stringify(known.request) !== fingerprint)
            throw refusal(grpc.status.ALREADY_EXISTS, "call_exists");
          return known.info();
        }
        const existing = roomRef ? this.rooms.get(roomRef) : undefined;
        if (!existing && this.load() >= this.limits.maxRooms)
          throw refusal(grpc.status.RESOURCE_EXHAUSTED, "at_capacity");
        const c = new Call(this, callRef, false);
        c.request = JSON.parse(fingerprint);
        c.from = String(req.from ?? "");
        c.to = to.uri;
        c.roomRef = roomRef || newRef("room");
        c.endpoint = String(req.session || this.options.sessionEndpoint);
        c.metadata = (req.metadata as Record<string, string>) ?? {};
        c.headers = { ...(to.headers ?? {}) };
        c.lowerMax(Number(req.maxDurationS ?? 0));
        if (existing) {
          existing.dialing++;
          c.dialRoom = existing;
        } else {
          c.reserved = true;
          this.reserved++;
        }
        this.calls.set(callRef, c);
        const info = c.info();
        c.event("call.started", {
          direction: "outbound",
          from: c.from,
          to: c.to
        });
        void this.runOutbound(c);
        return info;
      }),
      EndCall: unary((req) => {
        const c = this.calls.get(String(req.callRef ?? ""));
        if (!c) throw refusal(grpc.status.NOT_FOUND, "call_not_found");
        if (c.ending) return {};
        if (c.state === "RINGING" && !c.inbound && c.dialAbort) {
          c.removed = true;
          c.dialAbort.abort();
        } else setImmediate(() => c.end(ENDED_CAUSE.removed));
        return {};
      }),
      CreateRoom: unary((req) => {
        const ref = String(req.roomRef ?? "");
        if (ref && !validRef(ref)) throw bad("bad room_ref");
        const opened = this.openRoom(ref, false);
        if (opened === "exists")
          throw refusal(grpc.status.ALREADY_EXISTS, "room_exists");
        if (opened === "full")
          throw refusal(grpc.status.RESOURCE_EXHAUSTED, "at_capacity");
        const empty = Number(req.emptyRoomTimeoutS ?? 0);
        const max = Number(req.maxParticipants ?? 0);
        const dur = Number(req.maxDurationS ?? 0);
        if (empty > 0) opened.emptyTimeoutMs = empty * 1000;
        if (max > 0) opened.maxParticipants = max;
        if (dur > 0 && dur * 1000 < opened.maxDurationMs)
          opened.maxDurationMs = dur * 1000;
        return { roomRef: opened.ref };
      }),
      EndRoom: unary((req) => {
        const r = this.rooms.get(String(req.roomRef ?? ""));
        if (!r) throw refusal(grpc.status.NOT_FOUND, "room_not_found");
        setImmediate(() => r.end(ENDED_CAUSE.removed));
        return {};
      }),
      AddParticipant: unary(async (req) => {
        const r = this.rooms.get(String(req.roomRef ?? ""));
        if (!r) throw refusal(grpc.status.NOT_FOUND, "room_not_found");
        if (req.webrtc)
          throw refusal(grpc.status.UNIMPLEMENTED, "not_supported");
        const listen = (req.listen as Roomr.ListenTrack[]) ?? [];
        const rtp = req.rtp as Roomr.MediaEndpoint | undefined;
        if (!rtp?.ip && listen.length) {
          const ref = await this.addListener(r, "", listen);
          return { participantRef: ref, roomRef: r.ref };
        }
        if (!rtp?.ip || !rtp.port) throw bad("rtp needs ip and port");
        if (rtp.codec && rtp.codec !== L16)
          throw refusal(grpc.status.INVALID_ARGUMENT, "unsupported_codec");
        if (r.parts.size >= r.maxParticipants)
          throw refusal(grpc.status.RESOURCE_EXHAUSTED, "room_full");
        const port = await new NodePort().bind(this.host);
        port.remote = { ip: rtp.ip, port: Number(rtp.port) };
        const p = new Part(
          newRef("p-rtp"),
          "rtp",
          L16,
          undefined,
          undefined,
          port
        );
        if (!r.add(p)) {
          port.close();
          throw refusal(grpc.status.RESOURCE_EXHAUSTED, "room_full");
        }
        r.participantEvent(p, "participant.joined");
        return {
          participantRef: p.ref,
          roomRef: r.ref,
          trackId: p.trackId,
          rtp: { ip: this.host, port: port.port, codec: L16 }
        };
      }),
      RemoveParticipant: unary((req) => {
        const roomRef = String(req.roomRef ?? "");
        const ref = String(req.participantRef ?? "");
        if (roomRef && !this.rooms.has(roomRef))
          throw refusal(grpc.status.NOT_FOUND, "room_not_found");
        const rooms = roomRef
          ? [this.rooms.get(roomRef)!]
          : [...this.rooms.values()];
        for (const r of rooms) {
          const p = r.parts.get(ref);
          if (p) {
            setImmediate(() => {
              r.remove(ref, ENDED_CAUSE.removed);
              if (p.call && p === p.call.leg) p.call.end(ENDED_CAUSE.removed);
              else if (p.call && p.kind === "phone") p.call.partyLeft(p);
            });
            return {};
          }
          if (this.removeListener(r, ref)) return {};
        }
        throw refusal(grpc.status.NOT_FOUND, "participant_not_found");
      })
    };
  }
}
