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
import { Roomr } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { RtpParty } from "./rtp";
import { camelFields, snakeFields } from "./wire";

// The fake session endpoint (redesign-roomr 11.1, 11.7): the app's side of the per-call control
// stream, a session.v1.Session server a Roomr node (the Go node or the fake one) connects to. It
// records every message the node sends (Start, Dtmf, Event) and plays the app on cue:
//
// - answer: Answer (inbound) or Ready (outbound) with its own app leg, after `answerAfterMs`;
// - reject: Reject with `sipStatus` (inbound; an outbound call gets Hangup);
// - stall:  never Answer or Ready (the node's answer and ready timeouts);
// - down:   nothing listens (the node's 503 and app_gone);
// - kill:   every open stream breaks at once and the endpoint stops listening.
//
// Each answered call holds a real UDP RTP app leg (L16/16000): it sends silence every 20 ms (or
// a tone on cue, or nothing when muted) and keeps what it hears, so scenarios assert audio.

export type SessionMode = "answer" | "reject" | "stall" | "down";

export type FakeSessionEndpointOptions = {
  mode?: SessionMode;
  /** Reject's SIP status (default 603). */
  sipStatus?: number;
  /** Delay before Answer or Ready (default 0). */
  answerAfterMs?: number;
  /** Answer's max_duration_s (0: none). */
  maxDurationS?: number;
  host?: string;
};

/** One message on a stream, in the suite's snake_case shape, with its direction. */
export type StreamFrame = {
  callRef: string;
  /** `stream.start`, `stream.dtmf`, `stream.participant_joined`, ..., `stream.closed`. */
  type: string;
  data: Record<string, unknown>;
};

/** One control stream the node opened. */
export class SessionStream {
  start?: Record<string, unknown>;
  readonly appLeg: RtpParty;
  answered = false;
  closed = false;
  /** stream.closed was recorded. */
  reported = false;
  readonly sent: Record<string, unknown>[] = [];

  constructor(
    readonly stream: Roomr.SessionServerStream,
    host: string
  ) {
    this.appLeg = new RtpParty(host);
  }

  get callRef(): string {
    return String(this.start?.call_ref ?? "");
  }

  get direction(): string {
    return String(this.start?.direction ?? "");
  }

  /** The node's media endpoint from Start. */
  get nodeMedia(): { ip: string; port: number } | undefined {
    const m = this.start?.media as { ip?: string; port?: number } | undefined;
    return m?.ip && m.port ? { ip: m.ip, port: Number(m.port) } : undefined;
  }

  /** Sends one AppMessage, given in snake_case (`{ hold: { music } }`). */
  send(message: Record<string, unknown>) {
    if (this.closed) return;
    this.sent.push(message);
    try {
      this.stream.write(camelFields(message) as Roomr.AppMessage);
    } catch {
      // the stream is gone
    }
  }

  /** Answer (inbound) or Ready (outbound) with this stream's app leg; starts its RTP. */
  async answer(options: { maxDurationS?: number } = {}) {
    if (this.answered || this.closed) return;
    this.answered = true;
    await this.appLeg.bind();
    const media = this.appLeg.endpoint();
    if (this.direction === "OUTBOUND") this.send({ ready: { media } });
    else
      this.send({
        answer: {
          media,
          ...(options.maxDurationS
            ? { max_duration_s: options.maxDurationS }
            : {})
        }
      });
    const node = this.nodeMedia;
    if (node) this.appLeg.start(node);
  }

  /** The stream breaks with no message (the app pod dies). */
  kill() {
    if (this.closed) return;
    this.closed = true;
    this.appLeg.close();
    try {
      this.stream.destroy(new Error("killed"));
    } catch {
      // gone
    }
  }

  close() {
    this.closed = true;
    this.appLeg.close();
  }
}

export class FakeSessionEndpoint extends EventEmitter {
  readonly streams: SessionStream[] = [];
  readonly frames: StreamFrame[] = [];
  address = "";
  private server?: grpc.Server;
  private port = 0;

  constructor(readonly options: FakeSessionEndpointOptions = {}) {
    super();
  }

  configure(options: Partial<FakeSessionEndpointOptions>) {
    Object.assign(this.options, options);
  }

  get mode(): SessionMode {
    return this.options.mode ?? "answer";
  }

  /** The stream of a call, else the last one opened. */
  stream(callRef?: string): SessionStream | undefined {
    if (callRef) return this.streams.find((s) => s.callRef === callRef);
    return this.streams[this.streams.length - 1];
  }

  /**
   * Starts listening (on the same port again after `kill`); in mode `down` it only reserves an
   * address nothing answers on.
   */
  async start(): Promise<string> {
    const host = this.options.host ?? "127.0.0.1";
    const server = new grpc.Server({
      // The node pings every 10 s, with no call in flight too.
      "grpc.keepalive_permit_without_calls": 1,
      "grpc.http2.min_ping_interval_without_data_ms": 1000
    });
    server.addService(Roomr.sessionService(), {
      Connect: (stream: Roomr.SessionServerStream) => this.onStream(stream)
    });
    this.port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        `${host}:${this.port}`,
        grpc.ServerCredentials.createInsecure(),
        (err, p) => (err ? reject(err) : resolve(p))
      )
    );
    this.address = `${host}:${this.port}`;
    this.server = server;
    if (this.mode === "down") await this.stopListening();
    return this.address;
  }

  /** Stops listening: connections are refused (mode `down`). */
  async stopListening() {
    const server = this.server;
    this.server = undefined;
    if (server) server.forceShutdown();
  }

  /** Changes mode; `down` stops listening, leaving `down` listens again. */
  async setMode(mode: SessionMode) {
    const was = this.mode;
    this.options.mode = mode;
    if (mode === "down" && was !== "down") await this.stopListening();
    if (mode !== "down" && !this.server) await this.start();
  }

  /** The app instance dies: every stream breaks, nothing listens until the mode changes. */
  async kill() {
    for (const s of this.streams) s.kill();
    this.options.mode = "down";
    await this.stopListening();
  }

  async stop() {
    for (const s of this.streams) s.close();
    await this.stopListening();
    this.removeAllListeners();
  }

  private record(
    s: SessionStream,
    type: string,
    data: Record<string, unknown>
  ) {
    const frame = { callRef: s.callRef, type, data };
    this.frames.push(frame);
    this.emit("frame", frame);
  }

  private onStream(stream: Roomr.SessionServerStream) {
    const s = new SessionStream(stream, this.options.host ?? "127.0.0.1");
    this.streams.push(s);
    stream.on("data", (m: Roomr.NodeMessage) => this.onMessage(s, m));
    const closed = () => {
      if (s.reported) return;
      s.reported = true;
      s.close();
      this.record(s, "stream.closed", { call_ref: s.callRef });
      try {
        stream.end();
      } catch {
        // gone
      }
    };
    stream.on("end", closed);
    stream.on("error", closed);
    stream.on("cancelled", closed);
  }

  private onMessage(s: SessionStream, m: Roomr.NodeMessage) {
    const member = Roomr.messageType(
      m as Record<string, unknown>,
      Roomr.NODE_MESSAGE_TYPES
    );
    if (!member) return;
    const body = snakeFields<Record<string, unknown>>(
      (m as Record<string, unknown>)[member] ?? {}
    );
    if (member === "start") {
      s.start = { ...body, call_ref: body.call_ref };
      this.record(s, "stream.start", body);
      this.emit("start", s);
      this.onStart(s);
      return;
    }
    if (member === "dtmf") {
      this.record(s, "stream.dtmf", { call_ref: s.callRef, ...body });
      return;
    }
    // An Event: its oneof member names the frame (participant_joined, ..., ended).
    const event = (m as Record<string, unknown>).event as Record<
      string,
      unknown
    >;
    const which = Roomr.messageType(event, Roomr.SESSION_EVENT_TYPES);
    if (!which) return;
    const snake = which.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    this.record(s, `stream.${snake}`, {
      call_ref: s.callRef,
      ...snakeFields<Record<string, unknown>>(event[which] ?? {})
    });
  }

  private onStart(s: SessionStream) {
    const { mode, answerAfterMs = 0 } = this.options;
    if (mode === "stall") return;
    if (mode === "reject") {
      const sipStatus = this.options.sipStatus ?? 603;
      if (s.direction === "OUTBOUND")
        s.send({ hangup: { sip_status: sipStatus } });
      else s.send({ reject: { sip_status: sipStatus } });
      return;
    }
    const go = () => void s.answer({ maxDurationS: this.options.maxDurationS });
    if (answerAfterMs > 0) setTimeout(go, answerAfterMs);
    else go();
  }
}
