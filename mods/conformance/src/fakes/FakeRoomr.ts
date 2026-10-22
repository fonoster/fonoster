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
import { TestApp } from "@fonoster/roomr/contract";
import { CalleeMode, FakeNode, RoomrMethod } from "@fonoster/roomr/fake";
import * as grpc from "@grpc/grpc-js";
import { NatsConnection } from "nats";
import { sharedRoomrFake } from "./sharedRoomrFake";

// A Roomr node for controller suites (extract-roomr 2.3): a real node in roomr-fake, with its own
// Roomr gRPC address, heartbeats on roomr.nodes.<node_ref>.heartbeat and a call's events on
// roomr.events.<call_ref>, published on the fake's NATS ($CONFORMANCE_NATS_URL). Its phone answers
// what it dials as scripted, and a session endpoint of its own takes answered calls, so a call
// stays up until a test ends it. Tests script refusals and stalls per RPC and read the requests.

/**
 * What the dialed party does: answer, refuse (busy 486, no_answer 480, decline 603), ring until
 * `answer()`, or `fail` (an unavailable callee, 480: the node has no SIP-less failure).
 */
export type FakeCallee =
  | "answer"
  | "busy"
  | "no_answer"
  | "decline"
  | "fail"
  | "ring";

export type FakeRoomrOptions = {
  nodeRef?: string;
  /** Not used: the fake publishes on its own NATS ($CONFORMANCE_NATS_URL). */
  nc?: NatsConnection;
  /** Rooms the node already holds: real rooms that count toward maxRooms. */
  rooms?: number;
  /** The room limit (default the node's, 200). */
  maxRooms?: number;
  /** What heartbeats claim instead of the real count (a node that filled up since its beat). */
  reportedRooms?: number;
  region?: string;
  heartbeatMs?: number;
  /** What every dialed party does (default "answer"); `callee()` scripts one call_ref. */
  callee?: FakeCallee;
};

const MODE: Record<FakeCallee, CalleeMode> = {
  answer: "answer",
  busy: "busy",
  no_answer: "no_answer",
  decline: "decline",
  fail: "unavailable",
  ring: "ring"
};

export class FakeRoomr {
  readonly nodeRef: string;
  controlAddr = "";
  private node?: FakeNode;
  private app?: TestApp;

  constructor(readonly options: FakeRoomrOptions = {}) {
    this.nodeRef =
      options.nodeRef ??
      `fake-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }

  /** Starts the node; resolves with its control address. */
  async start(): Promise<string> {
    this.app = await TestApp.start();
    const fake = await sharedRoomrFake();
    this.node = await fake.createNode({
      nodeRef: this.nodeRef,
      rooms: this.options.rooms,
      maxRooms: this.options.maxRooms,
      reportedRooms: this.options.reportedRooms,
      region: this.options.region,
      heartbeatMs: this.options.heartbeatMs ?? 500,
      sessionEndpoint: this.app.address,
      callee: { mode: MODE[this.options.callee ?? "answer"] }
    });
    this.controlAddr = this.node.controlAddr;
    return this.controlAddr;
  }

  private get started(): FakeNode {
    if (!this.node) throw new Error(`FakeRoomr ${this.nodeRef}: not started`);
    return this.node;
  }

  /** What the dialed party of one call_ref does. */
  callee(callee: FakeCallee, callRef: string): Promise<void> {
    return this.started.callee(MODE[callee], { callRef });
  }

  /** The requests of one RPC ("CreateCall", ...), as camelCase objects, in order. */
  async of(method: RoomrMethod): Promise<Record<string, any>[]> {
    return (await this.started.requests(method)).map((r) => r.request);
  }

  /** Every request the node received, in order. */
  async requests(): Promise<
    { method: RoomrMethod; request: Record<string, any> }[]
  > {
    return (await this.started.requests()).map(({ method, request }) => ({
      method,
      request
    }));
  }

  /** INVITEs sent: one per call_ref the node took (a repeated CreateCall sends none). */
  async invites(): Promise<number> {
    const refs = new Set(
      (await this.of("CreateCall")).map((r) => String(r.callRef))
    );
    let known = 0;
    for (const ref of refs) {
      const s = await this.started
        .call(ref)
        .status()
        .catch(() => undefined);
      if (s) known += 1;
    }
    return known;
  }

  /** The node's state of a call: ringing, answered or ended ("" once it forgot it). */
  async callState(callRef: string): Promise<string> {
    return (await this.started.call(callRef).status()).state;
  }

  /** Rooms the node holds. */
  async roomCount(): Promise<number> {
    return (await this.started.info()).rooms;
  }

  /** The next `times` calls of `method` fail with `code`. */
  failNext(method: RoomrMethod, code: grpc.status, times = 1) {
    return this.started.failNext(method, code, times);
  }

  /** The next `times` calls of `method` are served only after `ms` (past the caller's deadline). */
  stallNext(method: RoomrMethod, ms: number, times = 1) {
    return this.started.stallNext(method, ms, times);
  }

  /** The dialed party of a ringing call (callee "ring") answers. */
  async answer(callRef: string) {
    await this.started.call(callRef).answer();
  }

  /** The dialed party hangs up: call.ended callee_hangup. */
  async hangUp(callRef: string) {
    await this.started.call(callRef).hangup();
  }

  /** Ends a call with any cause (app_gone, media_timeout, ...), as the node would. */
  async endCall(callRef: string, cause: string, sipStatus?: number) {
    await this.started.call(callRef).end(cause, sipStatus);
  }

  /** Says node.down (draining: not offered any more). */
  async down() {
    await this.started.down();
  }

  /** Dies without a word: no node.down, no more heartbeats, gRPC refuses. */
  async kill() {
    await this.node?.kill();
  }

  async stop() {
    await this.node?.stop();
    this.app?.stop();
  }
}
