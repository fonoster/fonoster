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
import { Roomr } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { NatsConnection, StringCodec } from "nats";

// A fake media node for controllers (redesign-media-node conformance, "fake controller with
// several nodes"): a roomr.v1.Roomr gRPC server with CreateRoom, CreateCall, EndCall and EndRoom,
// heartbeats on roomr.nodes.<node_ref>.heartbeat with its control_addr, and a call's events on
// roomr.events.<call_ref>. It keeps the node's contract: the room limit (RESOURCE_EXHAUSTED),
// CreateRoom refs (ALREADY_EXISTS), CreateCall dedupe by call_ref (the
// same Call again, ALREADY_EXISTS when the parameters differ) and NOT_FOUND for unknown refs.
// Tests script refusals and timeouts per RPC and decide what each dialed party does.

const sc = StringCodec();

/** What the dialed party does: answer, refuse (486, 408, 603) or ring until `answer()`. */
export type FakeCallee = "answer" | "busy" | "no_answer" | "decline" | "ring";

export type FakeRoomrOptions = {
  nodeRef?: string;
  /** Heartbeats and call events go here when set. */
  nc?: NatsConnection;
  /** Rooms the node already holds (not visible as refs). */
  rooms?: number;
  /** The room limit; unset: none. */
  maxRooms?: number;
  /** What heartbeats claim instead of the real count (a node that filled up since its beat). */
  reportedRooms?: number;
  region?: string;
  heartbeatMs?: number;
  /** What each dialed party does (default "answer"); a function decides per call_ref. */
  callee?: FakeCallee | ((callRef: string) => FakeCallee);
};

type Recorded = { method: string; request: Record<string, unknown> };

type FakeCall = {
  call: Roomr.Call;
  request: Record<string, unknown>;
  seq: number;
};

const ENDINGS: Record<string, { cause: string; sip: number }> = {
  busy: { cause: "busy", sip: 486 },
  no_answer: { cause: "no_answer", sip: 408 },
  decline: { cause: "rejected", sip: 603 }
};

export class FakeRoomr {
  readonly nodeRef: string;
  readonly requests: Recorded[] = [];
  readonly rooms = new Set<string>();
  readonly calls = new Map<string, FakeCall>();
  controlAddr = "";
  private extraRooms: number;
  private server?: grpc.Server;
  private timer?: ReturnType<typeof setInterval>;
  private scripted = new Map<
    string,
    { code?: grpc.status; stallMs?: number; times: number }[]
  >();

  constructor(readonly options: FakeRoomrOptions = {}) {
    this.nodeRef =
      options.nodeRef ??
      `fake-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    this.extraRooms = options.rooms ?? 0;
  }

  /** The requests of one RPC ("CreateCall", ...). */
  of(method: string) {
    return this.requests
      .filter((r) => r.method === method)
      .map((r) => r.request);
  }

  /** The next `times` calls of `method` fail with `code`. */
  failNext(method: string, code: grpc.status, times = 1) {
    this.script(method, { code, times });
  }

  /** The next `times` calls of `method` answer only after `ms` (past the caller's deadline). */
  stallNext(method: string, ms: number, times = 1) {
    this.script(method, { stallMs: ms, times });
  }

  private script(
    method: string,
    step: { code?: grpc.status; stallMs?: number; times: number }
  ) {
    const steps = this.scripted.get(method) ?? [];
    steps.push(step);
    this.scripted.set(method, steps);
  }

  private nextStep(method: string) {
    const steps = this.scripted.get(method);
    const step = steps?.[0];
    if (!step) return undefined;
    step.times -= 1;
    if (step.times <= 0) steps!.shift();
    return step;
  }

  /** Room count as the node counts it. */
  get roomCount() {
    return this.extraRooms + this.rooms.size;
  }

  private full() {
    const max = this.options.maxRooms;
    return max !== undefined && this.roomCount >= max;
  }

  private publish(subject: string, body: Record<string, unknown>) {
    this.options.nc?.publish(subject, sc.encode(JSON.stringify(body)));
  }

  private event(
    c: FakeCall,
    type: string,
    extra: Record<string, unknown> = {}
  ) {
    c.seq += 1;
    this.publish(`roomr.events.${c.call.callRef}`, {
      type,
      node_ref: this.nodeRef,
      call_ref: c.call.callRef,
      room_ref: c.call.roomRef,
      seq: c.seq,
      metadata: (c.request.metadata as Record<string, string>) ?? {},
      ts: new Date().toISOString(),
      ...extra
    });
  }

  private end(c: FakeCall, cause: string, sip?: number) {
    if (c.call.state === "ENDED") return;
    const answered = c.call.state === "ANSWERED";
    c.call.state = "ENDED";
    this.event(c, "call.ended", {
      cause,
      answered,
      ...(sip ? { sip_status: sip } : {})
    });
  }

  /** The dialed party of a ringing call answers. */
  answer(callRef: string) {
    const c = this.calls.get(callRef);
    if (!c || c.call.state !== "RINGING") return;
    c.call.state = "ANSWERED";
    c.call.participantRef = `p-${callRef}`;
    this.event(c, "call.answered", { participant_ref: c.call.participantRef });
  }

  /** The dialed party hangs up. */
  hangUp(callRef: string) {
    const c = this.calls.get(callRef);
    if (c) this.end(c, "callee_hangup");
  }

  private heartbeat() {
    this.publish(`roomr.nodes.${this.nodeRef}.heartbeat`, {
      type: "node.heartbeat",
      node_ref: this.nodeRef,
      control_addr: this.controlAddr,
      rooms: this.options.reportedRooms ?? this.roomCount,
      ...(this.options.maxRooms !== undefined
        ? { max_rooms: this.options.maxRooms }
        : {}),
      ...(this.options.region ? { region: this.options.region } : {})
    });
  }

  private handlers(): grpc.UntypedServiceImplementation {
    type Cb = grpc.sendUnaryData<unknown>;
    const refuse = (cb: Cb, code: grpc.status, details: string) =>
      cb({ code, details, name: "", message: details } as grpc.ServiceError);
    const wrap =
      (
        method: string,
        fn: (request: Record<string, unknown>, cb: Cb) => void
      ) =>
      (
        call: grpc.ServerUnaryCall<Record<string, unknown>, unknown>,
        cb: Cb
      ) => {
        const request = call.request;
        this.requests.push({ method, request });
        const step = this.nextStep(method);
        if (step?.code !== undefined)
          return refuse(cb, step.code, `scripted ${grpc.status[step.code]}`);
        if (step?.stallMs) {
          setTimeout(() => fn(request, cb), step.stallMs);
          return;
        }
        fn(request, cb);
      };
    return {
      CreateRoom: wrap("CreateRoom", (req, cb) => {
        const ref = String(req.roomRef || `room-${this.rooms.size + 1}`);
        if (this.rooms.has(ref))
          return refuse(cb, grpc.status.ALREADY_EXISTS, "room_exists");
        if (this.full())
          return refuse(cb, grpc.status.RESOURCE_EXHAUSTED, "at_capacity");
        this.rooms.add(ref);
        cb(null, { roomRef: ref });
      }),
      EndRoom: wrap("EndRoom", (req, cb) => {
        const ref = String(req.roomRef);
        if (!this.rooms.delete(ref))
          return refuse(cb, grpc.status.NOT_FOUND, "room_not_found");
        for (const c of this.calls.values())
          if (c.call.roomRef === ref) this.end(c, "removed");
        cb(null, {});
      }),
      CreateCall: wrap("CreateCall", (req, cb) => {
        const callRef = String(req.callRef || `call-${this.calls.size + 1}`);
        const known = this.calls.get(callRef);
        if (known) {
          if (JSON.stringify(known.request) !== JSON.stringify(req))
            return refuse(cb, grpc.status.ALREADY_EXISTS, "call_exists");
          return cb(null, known.call);
        }
        let roomRef = String(req.roomRef || "");
        if (!roomRef || !this.rooms.has(roomRef)) {
          if (this.full())
            return refuse(cb, grpc.status.RESOURCE_EXHAUSTED, "at_capacity");
          roomRef ||= `room-${callRef}`;
          this.rooms.add(roomRef);
        }
        const c: FakeCall = {
          call: { callRef, roomRef, state: "RINGING", participantRef: "" },
          request: req,
          seq: 0
        };
        this.calls.set(callRef, c);
        cb(null, { ...c.call });
        this.event(c, "call.started", { direction: "outbound" });
        this.event(c, "call.ringing");
        const option = this.options.callee ?? "answer";
        const callee = typeof option === "function" ? option(callRef) : option;
        if (callee === "answer") this.answer(callRef);
        else if (ENDINGS[callee]) {
          this.end(c, ENDINGS[callee].cause, ENDINGS[callee].sip);
          this.rooms.delete(roomRef);
        }
      }),
      EndCall: wrap("EndCall", (req, cb) => {
        const c = this.calls.get(String(req.callRef));
        if (!c) return refuse(cb, grpc.status.NOT_FOUND, "call_not_found");
        this.end(c, "removed");
        cb(null, {});
      })
    };
  }

  /** Serves on a loopback port and starts heartbeats; resolves with the control address. */
  async start(): Promise<string> {
    const server = new grpc.Server();
    server.addService(Roomr.roomrService(), this.handlers());
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (err, p) => (err ? reject(err) : resolve(p))
      )
    );
    this.server = server;
    this.controlAddr = `127.0.0.1:${port}`;
    if (this.options.nc) {
      this.heartbeat();
      this.timer = setInterval(
        () => this.heartbeat(),
        this.options.heartbeatMs ?? 500
      );
    }
    return this.controlAddr;
  }

  /** Says node.down and stops. */
  async down() {
    this.publish(`roomr.nodes.${this.nodeRef}.heartbeat`, {
      type: "node.down",
      node_ref: this.nodeRef
    });
    await this.stop();
  }

  /** Dies without a word: no node.down, no more heartbeats, connections dropped. */
  kill() {
    clearInterval(this.timer);
    this.server?.forceShutdown();
  }

  async stop() {
    clearInterval(this.timer);
    const server = this.server;
    this.server = undefined;
    if (server)
      await new Promise<void>((resolve) => server.tryShutdown(() => resolve()));
  }
}
