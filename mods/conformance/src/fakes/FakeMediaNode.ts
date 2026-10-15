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
  "answer",
  "room.create",
  "participant.add",
  "participant.dial",
  "participant.remove",
  "transfer",
  "hold",
  "resume",
  "dtmf.send",
  "listener.attach",
  "listener.detach",
  "room.end",
  "hangup"
] as const;

export type DialOutcome = "answered" | "busy" | "no_answer" | "failed";

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
};

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
  participants: Map<string, Participant>;
  ended: boolean;
};

type ReceivedPacket = { at: number; ms: number; audible: boolean };

class SessionRtp {
  readonly received: ReceivedPacket[] = [];
  private socket = dgram.createSocket("udp4");
  private timer?: ReturnType<typeof setTimeout>;
  private seq = Math.floor(Math.random() * 0xffff);
  private timestamp = Math.floor(Math.random() * 0xffffffff);
  private ssrc = Math.floor(Math.random() * 0xffffffff);

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
      const payload = this.pending.shift() ?? silence;
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
    this.socket.send(
      Buffer.concat([header, payload]),
      this.remote.port,
      this.remote.host
    );
  }

  private onPacket(msg: Buffer) {
    if (msg.length < 12 || msg[0] >> 6 !== 2) return;
    const csrcCount = msg[0] & 0x0f;
    let offset = 12 + csrcCount * 4;
    if (msg[0] & 0x10) offset += 4 + msg.readUInt16BE(offset + 2) * 4;
    const payload = msg.subarray(offset);
    this.received.push({
      at: Date.now(),
      ms: durationMs(payload.length, this.format),
      audible: isAudible(payload, this.format)
    });
  }

  close() {
    if (this.timer) clearTimeout(this.timer);
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
  // Kept after participants leave, so measurements still see their audio.
  private sessions: SessionRtp[] = [];
  private subscription?: Subscription;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly options: FakeMediaNodeOptions = {}) {
    super();
    this.nodeId = options.nodeId ?? "fake-node";
  }

  configure(options: Partial<FakeMediaNodeOptions>) {
    Object.assign(this.options, options);
  }

  // ---- driving the call ------------------------------------------------------------------

  /** Offers an inbound call, as a SIP INVITE from Routr would. */
  offerCall(
    call: {
      from?: string;
      to?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ) {
    const room = this.createRoom();
    const caller = this.addParticipant(room, "phone", ref("p-caller"));
    this.emitEvent({
      type: "call.incoming",
      roomRef: room.roomRef,
      participant: {
        participantRef: caller.participantRef,
        tracks: caller.tracks
      },
      from: call.from ?? "+15550001111",
      to: call.to ?? "+15550002222",
      metadata: call.metadata ?? {}
    });
    return { roomRef: room.roomRef, participantRef: caller.participantRef };
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
    const room = this.rooms.get(roomRef);
    if (!room) return;
    const caller = [...room.participants.values()].find(
      (p) => p.kind === "phone"
    );
    if (caller)
      this.emitEvent({
        type: "participant.left",
        roomRef,
        participantRef: caller.participantRef
      });
    this.endRoom(room);
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
      return ack({ roomRef: this.createRoom().roomRef });
    }

    const room = this.rooms.get(String(command.roomRef ?? this.lastRoomRef()));
    if (!room || room.ended) return error("room_not_found");

    switch (command.type) {
      case "participant.add":
        return this.addSession(room, command);
      case "participant.dial":
        this.dial(room, command);
        return ack();
      case "participant.remove": {
        const ref = String(command.participantRef);
        const p = room.participants.get(ref);
        if (!p) return error("participant_not_found");
        this.removeParticipant(room, p, id);
        return ack();
      }
      case "transfer":
        this.transfer(room, command);
        return ack();
      case "listener.attach":
        return ack({
          participantRef: this.addParticipant(
            room,
            "listener",
            ref("p-listener")
          ).participantRef
        });
      case "room.end":
      case "hangup":
        this.later(() => this.endRoom(room, id), 0);
        return ack();
      default:
        // answer, hold, resume, dtmf.send, listener.detach
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
    this.on("event", (event: MediaEvent) =>
      nc.publish(`${events}.${event.roomRef}`, sc.encode(JSON.stringify(event)))
    );
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

  /** ms between `since` and the last audible packet after it (0 if none arrived). */
  outputSilentWithinMs(since: number): number {
    const audible = this.receivedAudio().filter(
      (p) => p.at >= since && p.audible
    );
    return audible.length ? audible[audible.length - 1].at - since : 0;
  }

  async stop() {
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

  private createRoom(): Room {
    const room: Room = {
      roomRef: ref("room"),
      participants: new Map(),
      ended: false
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
      | { host?: string; port?: number; codec?: string }
      | undefined;
    if (!rtp?.host || !rtp.port || !rtp.codec) {
      return { type: "error", id: command.id, code: "bad_message" };
    }
    const format = parseFormat(rtp.codec);
    const session = this.addParticipant(room, "session", ref("p-session"));
    session.tracks[0].codec = rtp.codec;
    session.rtp = new SessionRtp(format, format.codec === "pcmu" ? 0 : 96, {
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
      rtp: local
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
          status: outcome
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

    this.later(() => {
      if (outcome !== "answered") {
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
        if (session) this.removeParticipant(room, session, command.id);
      }
      this.emitEvent({
        type: "transfer.result",
        id: command.id,
        roomRef: room.roomRef,
        status: "completed"
      });
    }, after);
  }

  private removeParticipant(room: Room, p: Participant, id?: string) {
    p.rtp?.close();
    room.participants.delete(p.participantRef);
    this.emitEvent({
      type: "participant.left",
      id,
      roomRef: room.roomRef,
      participantRef: p.participantRef
    });
  }

  private endRoom(room: Room, id?: string) {
    if (room.ended) return;
    room.ended = true;
    for (const p of room.participants.values()) p.rtp?.close();
    this.emitEvent({ type: "room.ended", id, roomRef: room.roomRef });
  }
}
