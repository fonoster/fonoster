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
import { EventEmitter } from "events";
import * as fs from "fs";
import { NatsConnection, StringCodec, Subscription } from "nats";
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

// The media-control message shapes, reply envelope ({type: "ack" | "error", id}) and NATS subjects
// follow add-media-node/specs/media-control ("media-control runs over NATS request and reply").

export type MediaCommand = { type: string; id: string; [key: string]: unknown };
export type MediaReply = {
  type: "ack" | "error";
  id: string;
  code?: string;
  [key: string]: unknown;
};
export type MediaEvent = { type: string; id?: string; [key: string]: unknown };

export const MEDIA_COMMANDS = [
  "ring",
  "answer",
  "room.create",
  "participant.add",
  "participant.dial",
  "participant.remove",
  "transfer",
  "transfer.complete",
  "hold",
  "resume",
  "dtmf.send",
  "listener.attach",
  "listener.detach",
  "room.end",
  "hangup"
] as const;

export type DialOutcome = "answered" | "busy" | "no_answer" | "failed";

/** media-control ending reasons ("Endings carry a reason"). */
export type EndReason =
  | "caller_hangup"
  | "callee_hangup"
  | "busy"
  | "no_answer"
  | "rejected"
  | "media_timeout"
  | "node_error"
  | "max_duration"
  | "removed";

/** Where nodes send `call.incoming` requests (media-control, claimed by one gateway). */
export const INCOMING_SUBJECT = "gateway.incoming";
const SIP_STATUS: Partial<Record<DialOutcome, number>> = {
  busy: 486,
  no_answer: 480,
  failed: 503
};

export type FakeMediaNodeOptions = {
  nodeId?: string;
  /** Address the node's RTP sockets bind to and advertise (default 127.0.0.1). */
  host?: string;
  /** Caller audio played to the session participant once it joins. */
  callerAudio?: AudioSource & { pcm16le?: Buffer };
  /** Outcome of participant.dial and of cold or warm transfers (default answered). */
  dialOutcome?: DialOutcome;
  /** Delay before a dial or transfer is answered (default 50 ms). */
  answerAfterMs?: number;
  /** Sent as `appRef` in call.incoming, as Routr's X-App-Ref would be. */
  appRef?: string;
  /** How long to wait for a gateway to claim a call (default 500 ms, then one retry). */
  claimTimeoutMs?: number;
  /** Heartbeat period once attached to NATS (default 2000 ms; 0 disables). */
  heartbeatMs?: number;
  /** Rooms the node holds at once; room.create beyond it gets at_capacity (default 200). */
  maxRooms?: number;
};

/** The room events that make up a call's status, also published on `calls.<callRef>.events`. */
const CALL_EVENTS = new Set(["call.progress", "call.answered", "room.ended"]);

type Track = {
  trackId: number;
  kind: "audio";
  codec: string;
  direction: "sendrecv" | "recv";
};

type Participant = {
  participantRef: string;
  kind: "phone" | "session" | "listener";
  tracks: Track[];
  rtp?: SessionRtp;
};

type Room = {
  roomRef: string;
  /** The API-originated call the room was created for (room.create callRef). */
  callRef?: string;
  participants: Map<string, Participant>;
  ended: boolean;
  held: boolean;
  /** SIP status the caller got (180, 200, or the refusal). */
  sip: number[];
};

type ReceivedPacket = { at: number; ms: number; audible: boolean };

/**
 * One listener fork: re-sends a track's payloads as their own RTP stream (media-control,
 * "Listeners fork audio by track"). The fake forwards payloads in the session's codec as they
 * are; the Go node transcodes to the codec each fork asks for.
 */
class ForkRtp {
  private socket = dgram.createSocket("udp4");
  private seq = Math.floor(Math.random() * 0xffff);
  private timestamp = Math.floor(Math.random() * 0xffffffff);
  private readonly ssrc = Math.floor(Math.random() * 0xffffffff);
  closed = false;

  constructor(
    private readonly remote: { host: string; port: number },
    private readonly payloadType: number,
    private readonly samplesPerFrame: number
  ) {
    this.socket.on("error", () => undefined);
  }

  send(payload: Buffer) {
    if (this.closed) return;
    const header = Buffer.alloc(12);
    header[0] = 0x80;
    header[1] = this.payloadType & 0x7f;
    header.writeUInt16BE(this.seq, 2);
    header.writeUInt32BE(this.timestamp >>> 0, 4);
    header.writeUInt32BE(this.ssrc >>> 0, 8);
    this.seq = (this.seq + 1) & 0xffff;
    this.timestamp = (this.timestamp + this.samplesPerFrame) >>> 0;
    this.socket.send(
      Buffer.concat([header, payload]),
      this.remote.port,
      this.remote.host
    );
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

class SessionRtp {
  readonly received: ReceivedPacket[] = [];
  /** When each audible caller packet left for the gateway (pass bar T1, caller audio to STT). */
  readonly sentAudible: number[] = [];
  /** Listener forks of the caller's track (what this sends) and of the session's (what it gets). */
  readonly callerForks: ForkRtp[] = [];
  readonly sessionForks: ForkRtp[] = [];
  private socket = dgram.createSocket("udp4");
  private timer?: ReturnType<typeof setTimeout>;
  /** On hold the session participant hears silence (media-control, hold by mixing). */
  held = false;
  private seq = Math.floor(Math.random() * 0xffff);
  private timestamp = Math.floor(Math.random() * 0xffffffff);
  readonly ssrc = Math.floor(Math.random() * 0xffffffff);

  constructor(
    readonly format: AudioFormat,
    private readonly payloadType: number,
    private readonly remote: { host: string; port: number }
  ) {}

  async bind(host: string): Promise<{ host: string; port: number }> {
    this.socket.on("message", (msg) => this.onPacket(msg));
    await new Promise<void>((resolve) => this.socket.bind(0, host, resolve));
    return { host, port: this.socket.address().port };
  }

  /** Sends caller audio as RTP at real-time pace, then silence until stopped. */
  private pending: Buffer[] = [];

  play(audio: Buffer) {
    this.pending = splitFrames(audio, this.format);
    const silence = encode(
      generate("silence", FRAME_MS, this.format.rate),
      this.format
    );
    const samplesPerFrame = (this.format.rate / 1000) * FRAME_MS;
    const start = Date.now();
    let i = 0;

    const tick = () => {
      const next = this.pending.shift();
      const payload = this.held ? silence : (next ?? silence);
      this.send(payload, samplesPerFrame);
      i++;
      this.timer = setTimeout(
        tick,
        Math.max(0, start + i * FRAME_MS - Date.now())
      );
    };
    tick();
  }

  /** Replaces whatever caller audio is still pending with new audio, from the next frame. */
  speak(audio: Buffer) {
    this.pending = splitFrames(audio, this.format);
  }

  private send(payload: Buffer, samples: number) {
    const header = Buffer.alloc(12);
    header[0] = 0x80;
    header[1] = this.payloadType & 0x7f;
    header.writeUInt16BE(this.seq, 2);
    header.writeUInt32BE(this.timestamp >>> 0, 4);
    header.writeUInt32BE(this.ssrc >>> 0, 8);
    this.seq = (this.seq + 1) & 0xffff;
    this.timestamp = (this.timestamp + samples) >>> 0;
    if (isAudible(payload, this.format)) this.sentAudible.push(Date.now());
    this.socket.send(
      Buffer.concat([header, payload]),
      this.remote.port,
      this.remote.host
    );
    for (const f of this.callerForks) f.send(payload);
  }

  private onPacket(msg: Buffer) {
    if (msg.length < 12 || msg[0] >> 6 !== 2) return;
    const csrcCount = msg[0] & 0x0f;
    let offset = 12 + csrcCount * 4;
    if (msg[0] & 0x10) offset += 4 + msg.readUInt16BE(offset + 2) * 4;
    const payload = msg.subarray(offset);
    for (const f of this.sessionForks) f.send(payload);
    this.received.push({
      at: Date.now(),
      ms: durationMs(payload.length, this.format),
      audible: isAudible(payload, this.format)
    });
  }

  close() {
    if (this.timer) clearTimeout(this.timer);
    for (const f of [...this.callerForks, ...this.sessionForks]) f.close();
    try {
      this.socket.close();
    } catch {
      // already closed
    }
  }
}

let counter = 0;
const ref = (prefix: string) => `${prefix}-${++counter}`;

/**
 * Plays the media node for gateway suites: offers calls, plays recorded caller audio as RTP,
 * records the agent audio it is sent and acknowledges media-control commands. It knows nothing
 * about speech; that is the point of the contract.
 */
export class FakeMediaNode extends EventEmitter {
  readonly nodeId: string;
  readonly commands: { at: number; command: MediaCommand }[] = [];
  readonly events: { at: number; event: MediaEvent }[] = [];
  private rooms = new Map<string, Room>();
  /** Each attached listener's forks, closed on listener.detach (AO-B3). */
  private listenerForks = new Map<string, ForkRtp[]>();
  // Kept after participants leave, so measurements still see their audio.
  private sessions: SessionRtp[] = [];
  private subscription?: Subscription;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private nc?: NatsConnection;
  private heartbeat?: ReturnType<typeof setInterval>;
  private crashed = false;

  constructor(private readonly options: FakeMediaNodeOptions = {}) {
    super();
    this.nodeId = options.nodeId ?? "fake-node";
  }

  configure(options: Partial<FakeMediaNodeOptions>) {
    Object.assign(this.options, options);
    if (options.heartbeatMs !== undefined && this.nc) this.startHeartbeat();
  }

  private startHeartbeat() {
    clearInterval(this.heartbeat);
    const every = this.options.heartbeatMs ?? 2000;
    if (every <= 0) return;
    const beat = () =>
      this.publishStatus({
        type: "node.heartbeat",
        node_ref: this.nodeId,
        rooms: this.activeRooms(),
        max_rooms: this.maxRooms(),
        draining: false
      });
    beat();
    this.heartbeat = setInterval(beat, every);
  }

  // ---- driving the call ------------------------------------------------------------------

  /**
   * Offers an inbound call, as a SIP INVITE from Routr would: `call.incoming` goes to the gateway
   * queue group as a request; no claim within the timeout, twice, refuses the call with 503.
   */
  offerCall(
    call: {
      from?: string;
      to?: string;
      appRef?: string;
      callRef?: string;
      metadata?: Record<string, unknown>;
      /** The INVITE's X-* headers (e.g. X-Connect-Token). */
      headers?: Record<string, string>;
    } = {}
  ) {
    const room = this.createRoom();
    const caller = this.addParticipant(room, "phone", ref("p-caller"));
    const appRef = call.appRef ?? this.options.appRef;
    const event: MediaEvent = {
      type: "call.incoming",
      id: ref("in"),
      nodeId: this.nodeId,
      roomRef: room.roomRef,
      participantRef: caller.participantRef,
      participant: {
        participantRef: caller.participantRef,
        tracks: caller.tracks
      },
      ...(appRef ? { appRef } : {}),
      ...(call.callRef ? { callRef: call.callRef } : {}),
      direction: "inbound",
      from: call.from ?? "+15550001111",
      to: call.to ?? "+15550002222",
      callerName: "",
      headers: call.headers ?? {},
      metadata: call.metadata ?? {}
    };
    this.events.push({ at: Date.now(), event });
    this.emit("event", event);
    const claimed = this.claim(room, event);
    return {
      roomRef: room.roomRef,
      participantRef: caller.participantRef,
      claimed
    };
  }

  private async claim(room: Room, event: MediaEvent): Promise<boolean> {
    if (!this.nc) return true;
    const sc = StringCodec();
    const timeout = this.options.claimTimeoutMs ?? 500;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const msg = await this.nc.request(
          INCOMING_SUBJECT,
          sc.encode(JSON.stringify(event)),
          { timeout }
        );
        const reply = JSON.parse(sc.decode(msg.data));
        if (reply.type === "claimed") return true;
      } catch {
        // no gateway answered in time
      }
    }
    room.sip.push(503);
    this.endRoom(room, undefined, "node_error", 503);
    return false;
  }

  /** SIP statuses the caller of a room received, in order. */
  sipStatuses(roomRef = this.lastRoomRef()): number[] {
    return this.rooms.get(roomRef)?.sip ?? [];
  }

  /** Listeners attached and not yet detached (AO-B3). */
  activeListeners(): number {
    return this.listenerForks.size;
  }

  isHeld(roomRef = this.lastRoomRef()): boolean {
    return this.rooms.get(roomRef)?.held ?? false;
  }

  /** The caller speaks: audio replaces pending caller audio on every session participant. */
  callerSpeaks(source: AudioSource & { pcm16le?: Buffer }) {
    for (const session of this.sessions) {
      session.speak(this.audioFor(source, session.format));
    }
  }

  /** The caller presses a key. */
  pressKey(digit: string, roomRef = this.lastRoomRef()) {
    this.emitEvent({ type: "dtmf", roomRef, digit });
  }

  /** The caller hangs up. */
  callerHangup(roomRef = this.lastRoomRef()) {
    this.phoneHangup(roomRef, "caller_hangup");
  }

  /** The dialed party of an outbound call hangs up. */
  calleeHangup(roomRef = this.lastRoomRef()) {
    this.phoneHangup(roomRef, "callee_hangup");
  }

  private phoneHangup(
    roomRef: string,
    reason: "caller_hangup" | "callee_hangup"
  ) {
    const room = this.rooms.get(roomRef);
    if (!room) return;
    const caller = [...room.participants.values()].find(
      (p) => p.kind === "phone"
    );
    if (caller)
      this.emitEvent({
        type: "participant.left",
        roomRef,
        participantRef: caller.participantRef,
        reason
      });
    this.endRoom(room, undefined, reason);
  }

  /** The node ends the room itself (media timeout, maximum duration, ...). */
  dropRoom(
    reason: EndReason,
    sipStatus?: number,
    roomRef = this.lastRoomRef()
  ) {
    const room = this.rooms.get(roomRef);
    if (room) this.endRoom(room, undefined, reason, sipStatus);
  }

  /** The node dies: no more heartbeats, replies or events (media-control, liveness). */
  crash() {
    this.crashed = true;
    clearInterval(this.heartbeat);
    this.subscription?.unsubscribe();
    for (const session of this.sessions) session.close();
  }

  /** A clean shutdown: publishes node.down. */
  shutdown() {
    clearInterval(this.heartbeat);
    this.publishStatus({ type: "node.down", node_ref: this.nodeId });
  }

  private publishStatus(event: MediaEvent) {
    if (!this.nc || this.crashed) return;
    this.nc.publish(
      `roomr.nodes.${this.nodeId}.heartbeat`,
      StringCodec().encode(JSON.stringify(event))
    );
  }

  // ---- media-control -------------------------------------------------------------------

  async handle(command: MediaCommand): Promise<MediaReply> {
    this.commands.push({ at: Date.now(), command });
    const { id } = command;
    const ack = (extra: Record<string, unknown> = {}): MediaReply => ({
      type: "ack",
      id,
      ...extra
    });
    const error = (code: string): MediaReply => ({ type: "error", id, code });

    if (!(MEDIA_COMMANDS as readonly string[]).includes(command.type))
      return error("unknown_command");

    if (command.type === "room.create") {
      const callRef =
        typeof command.callRef === "string" && command.callRef !== ""
          ? command.callRef
          : undefined;
      if (callRef && /[.*>\s]/.test(callRef)) return error("bad_message");
      if (this.activeRooms() >= this.maxRooms()) return error("at_capacity");
      const room = this.createRoom();
      room.callRef = callRef;
      return ack({ roomRef: room.roomRef });
    }

    const room = this.rooms.get(String(command.roomRef ?? this.lastRoomRef()));
    if (!room || room.ended) return error("room_not_found");

    switch (command.type) {
      case "ring":
        room.sip.push(180);
        return ack();
      case "answer":
        room.sip.push(200);
        return ack();
      case "hold":
      case "resume":
        this.setHeld(room, command.type === "hold");
        return ack();
      case "transfer.complete": {
        this.setHeld(room, false);
        const session = [...room.participants.values()].find(
          (p) => p.kind === "session"
        );
        if (session) this.removeParticipant(room, session, id, "removed");
        this.emitEvent({
          type: "transfer.result",
          id,
          roomRef: room.roomRef,
          status: "completed"
        });
        return ack();
      }
      case "participant.add":
        return this.addSession(room, command);
      case "participant.dial":
        this.dial(room, command);
        return ack();
      case "participant.remove": {
        const ref = String(command.participantRef);
        const p = room.participants.get(ref);
        if (!p) return error("participant_not_found");
        this.removeParticipant(room, p, id, "removed");
        return ack();
      }
      case "transfer":
        this.transfer(room, command);
        return ack();
      case "listener.attach": {
        // One RTP destination per selected track (media-control, "Listeners fork audio by track").
        const tracks = command.tracks as
          | { trackId?: number; rtp?: { host?: string; port?: number } }[]
          | undefined;
        if (tracks?.some((t) => !t.rtp?.host || !t.rtp?.port))
          return error("bad_message");
        const listener = this.addParticipant(
          room,
          "listener",
          ref("p-listener")
        );
        const session = [...room.participants.values()].find(
          (p) => p.kind === "session" && p.rtp
        )?.rtp;
        const forks: ForkRtp[] = [];
        this.listenerForks.set(listener.participantRef, forks);
        for (const t of tracks ?? []) {
          const owner = [...room.participants.values()].find((p) =>
            p.tracks.some((x) => x.trackId === t.trackId)
          );
          if (!session || !owner) continue;
          const fork = new ForkRtp(
            { host: t.rtp!.host!, port: t.rtp!.port! },
            session.format.codec === "pcmu" ? 0 : 96,
            (session.format.rate / 1000) * FRAME_MS
          );
          forks.push(fork);
          if (owner.kind === "session") session.sessionForks.push(fork);
          else if (owner.kind === "phone") session.callerForks.push(fork);
          else fork.close();
        }
        return ack({
          listenerRef: listener.participantRef,
          participantRef: listener.participantRef
        });
      }
      case "room.end":
      case "hangup":
        if (typeof command.sipStatus === "number")
          room.sip.push(command.sipStatus);
        this.later(
          () =>
            this.endRoom(
              room,
              id,
              command.sipStatus ? "rejected" : "removed",
              command.sipStatus as number | undefined
            ),
          0
        );
        return ack();
      case "listener.detach": {
        // Stops the listener's forks at once; the listener leaves without room events.
        const listenerRef = String(command.listenerRef ?? "");
        const forks = this.listenerForks.get(listenerRef);
        if (!forks) return error("listener_not_found");
        this.listenerForks.delete(listenerRef);
        for (const f of forks) f.close();
        const session = [...room.participants.values()].find(
          (p) => p.kind === "session" && p.rtp
        )?.rtp;
        if (session) {
          const keep = (list: ForkRtp[]) =>
            list.splice(0, list.length, ...list.filter((f) => !f.closed));
          keep(session.callerForks);
          keep(session.sessionForks);
        }
        room.participants.delete(listenerRef);
        return ack();
      }
      default:
        // dtmf.send
        return ack();
    }
  }

  /**
   * Serves media-control over NATS request and reply. Events are published on
   * `<events>.<roomRef>` (default `media.<nodeId>.events.<roomRef>`).
   */
  attachNats(
    nc: NatsConnection,
    subjects: { commands?: string; events?: string } = {}
  ): { commands: string; events: string } {
    const commands = subjects.commands ?? `media.${this.nodeId}.commands`;
    const events = subjects.events ?? `media.${this.nodeId}.events`;
    const sc = StringCodec();
    this.nc = nc;
    this.startHeartbeat();

    this.subscription = nc.subscribe(commands, {
      callback: async (err, msg) => {
        if (err) return;
        let reply: MediaReply;
        try {
          reply = await this.handle(JSON.parse(sc.decode(msg.data)));
        } catch {
          reply = { type: "error", id: "", code: "bad_message" };
        }
        msg.respond(sc.encode(JSON.stringify(reply)));
      }
    });
    this.on("event", (event: MediaEvent) => {
      // call.incoming is a request to the gateways (offerCall), not a room event.
      if (event.type === "call.incoming" || this.crashed) return;
      nc.publish(
        `${events}.${event.roomRef}`,
        sc.encode(JSON.stringify(event))
      );
      const callRef = this.rooms.get(String(event.roomRef))?.callRef;
      if (callRef && CALL_EVENTS.has(event.type))
        nc.publish(
          `calls.${callRef}.events`,
          sc.encode(JSON.stringify({ ...event, callRef, nodeId: this.nodeId }))
        );
    });
    return { commands, events };
  }

  // ---- measurements ------------------------------------------------------------------

  /** Agent audio packets received on every session participant, oldest first. */
  receivedAudio(): ReceivedPacket[] {
    return this.sessions.flatMap((s) => s.received).sort((a, b) => a.at - b.at);
  }

  /** ms of audible agent audio received since `since`. */
  outputAudioMs(since: number): number {
    return Math.round(
      this.receivedAudio()
        .filter((p) => p.at >= since && p.audible)
        .reduce((sum, p) => sum + p.ms, 0)
    );
  }

  /** When the first audible caller packet at or after `since` was sent, if one was. */
  firstCallerAudibleSentAt(since: number): number | undefined {
    const sent = this.sessions
      .flatMap((s) => s.sentAudible)
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

  async stop() {
    clearInterval(this.heartbeat);
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    for (const session of this.sessions) session.close();
    this.subscription?.unsubscribe();
    this.removeAllListeners();
  }

  // ---- internals -------------------------------------------------------------------------

  private emitEvent(event: MediaEvent) {
    this.events.push({ at: Date.now(), event });
    this.emit("event", event);
  }

  private later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private lastRoomRef(): string {
    const refs = [...this.rooms.keys()];
    return refs[refs.length - 1];
  }

  private activeRooms(): number {
    return [...this.rooms.values()].filter((r) => !r.ended).length;
  }

  private maxRooms(): number {
    return this.options.maxRooms ?? 200;
  }

  private createRoom(): Room {
    const room: Room = {
      roomRef: ref("room"),
      participants: new Map(),
      ended: false,
      held: false,
      sip: []
    };
    this.rooms.set(room.roomRef, room);
    return room;
  }

  private addParticipant(
    room: Room,
    kind: Participant["kind"],
    participantRef: string
  ): Participant {
    const p: Participant = {
      participantRef,
      kind,
      tracks: [
        {
          trackId: room.participants.size + 1,
          kind: "audio",
          codec: "PCMU/8000",
          direction: kind === "listener" ? "recv" : "sendrecv"
        }
      ]
    };
    room.participants.set(participantRef, p);
    return p;
  }

  private async addSession(
    room: Room,
    command: MediaCommand
  ): Promise<MediaReply> {
    const rtp = command.rtp as
      | {
          host?: string;
          port?: number;
          codec?: string;
          payloadType?: number;
          ptime?: number;
        }
      | undefined;
    if (!rtp?.host || !rtp.port || !rtp.codec) {
      return { type: "error", id: command.id, code: "bad_message" };
    }
    let format: AudioFormat;
    try {
      format = parseFormat(rtp.codec);
    } catch {
      return { type: "error", id: command.id, code: "unsupported_codec" };
    }
    const payloadType = rtp.payloadType ?? (format.codec === "pcmu" ? 0 : 96);
    const session = this.addParticipant(room, "session", ref("p-session"));
    session.tracks[0].codec = rtp.codec;
    session.rtp = new SessionRtp(format, payloadType, {
      host: rtp.host,
      port: rtp.port
    });
    this.sessions.push(session.rtp);
    const local = await session.rtp.bind(this.options.host ?? "127.0.0.1");
    session.rtp.play(
      this.audioFor(
        this.options.callerAudio ?? { kind: "silence", ms: 0 },
        format
      )
    );
    this.emitEvent({
      type: "participant.joined",
      id: command.id,
      roomRef: room.roomRef,
      participantRef: session.participantRef,
      tracks: session.tracks
    });
    return {
      type: "ack",
      id: command.id,
      participantRef: session.participantRef,
      rtp: {
        ...local,
        codec: rtp.codec,
        payloadType,
        ptime: rtp.ptime ?? 20,
        ssrc: session.rtp.ssrc
      }
    };
  }

  private audioFor(
    source: AudioSource & { pcm16le?: Buffer },
    format: AudioFormat
  ): Buffer {
    if (source.kind === "file" || source.pcm16le) {
      let pcm = source.pcm16le ?? fs.readFileSync(source.file!);
      if (format.rate === 8000) {
        // Recordings are 16 kHz; a fake can afford naive decimation.
        const half = Buffer.alloc(Math.floor(pcm.length / 4) * 2);
        for (let i = 0; i < half.length / 2; i++)
          half.writeInt16LE(pcm.readInt16LE(i * 4), i * 2);
        pcm = half;
      }
      const samples = new Int16Array(pcm.length / 2);
      for (let i = 0; i < samples.length; i++)
        samples[i] = pcm.readInt16LE(i * 2);
      return encode(samples, format);
    }
    return encode(
      generate(source.kind ?? "tone", source.ms ?? 0, format.rate),
      format
    );
  }

  private dial(room: Room, command: MediaCommand) {
    const outcome = this.options.dialOutcome ?? "answered";
    const after = this.options.answerAfterMs ?? 50;
    this.emitEvent({
      type: "call.progress",
      id: command.id,
      roomRef: room.roomRef,
      status: "ringing"
    });
    this.later(() => {
      if (outcome !== "answered") {
        this.emitEvent({
          type: "call.progress",
          id: command.id,
          roomRef: room.roomRef,
          status: outcome,
          sipStatus: SIP_STATUS[outcome]
        });
        return;
      }
      const party = this.addParticipant(room, "phone", ref("p-dialed"));
      this.emitEvent({
        type: "call.answered",
        id: command.id,
        roomRef: room.roomRef,
        participantRef: party.participantRef
      });
      this.emitEvent({
        type: "participant.joined",
        id: command.id,
        roomRef: room.roomRef,
        participantRef: party.participantRef,
        tracks: party.tracks
      });
    }, after);
  }

  private transfer(room: Room, command: MediaCommand) {
    const mode = (command.mode as string) ?? "cold";
    const outcome = this.options.dialOutcome ?? "answered";
    const after = this.options.answerAfterMs ?? 50;
    // Warm: the caller waits on hold while the app briefs the new party ("Warm transfer").
    if (mode === "warm") this.setHeld(room, true);

    this.later(() => {
      if (outcome !== "answered") {
        if (mode === "warm") this.setHeld(room, false);
        this.emitEvent({
          type: "transfer.result",
          id: command.id,
          roomRef: room.roomRef,
          status: "failed",
          reason: outcome
        });
        return;
      }
      if (mode === "refer") {
        this.emitEvent({
          type: "transfer.result",
          id: command.id,
          roomRef: room.roomRef,
          status: "referred"
        });
        this.endRoom(room);
        return;
      }
      const party = this.addParticipant(room, "phone", ref("p-transfer"));
      this.emitEvent({
        type: "participant.joined",
        id: command.id,
        roomRef: room.roomRef,
        participantRef: party.participantRef,
        tracks: party.tracks
      });
      if (mode === "cold") {
        const session = [...room.participants.values()].find(
          (p) => p.kind === "session"
        );
        if (session)
          this.removeParticipant(room, session, command.id, "removed");
      }
      if (mode === "warm") return; // completed by transfer.complete
      this.emitEvent({
        type: "transfer.result",
        id: command.id,
        roomRef: room.roomRef,
        status: "completed"
      });
    }, after);
  }

  private setHeld(room: Room, held: boolean) {
    room.held = held;
    for (const p of room.participants.values()) if (p.rtp) p.rtp.held = held;
  }

  private removeParticipant(
    room: Room,
    p: Participant,
    id: string | undefined,
    reason: EndReason
  ) {
    p.rtp?.close();
    room.participants.delete(p.participantRef);
    this.emitEvent({
      type: "participant.left",
      id,
      roomRef: room.roomRef,
      participantRef: p.participantRef,
      reason
    });
  }

  private endRoom(
    room: Room,
    id?: string,
    reason: EndReason = "removed",
    sipStatus?: number
  ) {
    if (room.ended) return;
    room.ended = true;
    for (const p of room.participants.values()) p.rtp?.close();
    this.emitEvent({
      type: "room.ended",
      ...(id ? { id } : {}),
      roomRef: room.roomRef,
      reason,
      ...(sipStatus ? { sipStatus } : {})
    });
  }
}
