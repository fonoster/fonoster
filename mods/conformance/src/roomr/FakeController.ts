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
import { camelFields, errorReason, snakeFields, statusName } from "./wire";

// The fake controller (redesign-roomr 11.1, 11.8): a roomr.v1.Roomr client driving one or more
// nodes, fake or real, at their control addresses. `call` runs one RPC on one node; `place` is
// the controller's placement: score the nodes from their heartbeats (1 - rooms / max_rooms over
// fresh heartbeats below their limit), call CreateCall on the best, and move on to the next on
// RESOURCE_EXHAUSTED or UNAVAILABLE, up to 3 nodes (media-control "CreateCall dials out on the
// node the controller chose").

export const ROOMR_METHODS = [
  "CreateCall",
  "EndCall",
  "CreateRoom",
  "EndRoom",
  "AddParticipant",
  "RemoveParticipant"
] as const;

export type RoomrMethod = (typeof ROOMR_METHODS)[number];

/** One RPC's outcome, in the suite's snake_case: a reply, or a gRPC code and its reason. */
export type RpcResult = {
  ok: boolean;
  /** The node that answered (-1: none was tried). */
  node: number;
  /** The reply, when ok. */
  reply?: Record<string, unknown>;
  /** The gRPC status name, when not ok ("RESOURCE_EXHAUSTED"). */
  code?: string;
  /** The ErrorInfo reason ("at_capacity"), else the status message. */
  reason?: string;
  message?: string;
};

export type NodeTarget = { nodeRef: string; controlAddr: string };

/** A heartbeat as the controller keeps it. */
type Beat = { at: number; rooms: number; maxRooms: number; down: boolean };

export const HEARTBEAT_FRESH_MS = 6000;
export const MAX_PLACEMENT_TRIES = 3;
export const RPC_DEADLINE_MS = 3000;

export class FakeController {
  /** Every placement attempt: which node, and what it said. */
  readonly attempts: { node: number; node_ref: string; code: string }[] = [];
  private clients = new Map<string, grpc.Client>();
  private beats = new Map<string, Beat>();

  constructor(private readonly nodes: () => NodeTarget[]) {}

  /** Feeds one message from roomr.nodes.<node_ref>.heartbeat. */
  heartbeat(event: Record<string, unknown>) {
    const ref = String(event.node_ref ?? "");
    if (!ref) return;
    if (event.type === "node.down") {
      const b = this.beats.get(ref);
      this.beats.set(ref, {
        ...(b ?? { rooms: 0, maxRooms: 0 }),
        at: Date.now(),
        down: true
      });
      return;
    }
    this.beats.set(ref, {
      at: Date.now(),
      rooms: Number(event.rooms ?? 0),
      maxRooms: Number(event.max_rooms ?? 0),
      down: false
    });
  }

  private client(addr: string): grpc.Client {
    let c = this.clients.get(addr);
    if (!c) {
      const Client = Roomr.roomrPackage()
        .Roomr as grpc.ServiceClientConstructor;
      c = new Client(addr, grpc.credentials.createInsecure());
      this.clients.set(addr, c);
    }
    return c;
  }

  /** Runs one RPC on node `index`, with the request in snake_case. */
  call(
    index: number,
    method: RoomrMethod,
    request: Record<string, unknown>
  ): Promise<RpcResult> {
    const target = this.nodes()[index];
    if (!target) throw new Error(`no node ${index}`);
    const client = this.client(target.controlAddr) as unknown as Record<
      string,
      (
        req: unknown,
        options: grpc.CallOptions,
        cb: (err: grpc.ServiceError | null, res: unknown) => void
      ) => void
    >;
    return new Promise((resolve) =>
      client[method].call(
        client,
        camelFields(request),
        { deadline: Date.now() + RPC_DEADLINE_MS },
        (err, res) =>
          resolve(
            err
              ? {
                  ok: false,
                  node: index,
                  code: statusName(err.code),
                  reason: errorReason(err) ?? err.details,
                  message: err.details
                }
              : { ok: true, node: index, reply: snakeFields(res ?? {}) }
          )
      )
    );
  }

  /** Nodes in placement order: fresh, not down, below their limit; best score first. */
  eligible(): number[] {
    const now = Date.now();
    return this.nodes()
      .map((n, i) => ({ i, beat: this.beats.get(n.nodeRef) }))
      .filter(
        ({ beat }) =>
          beat &&
          !beat.down &&
          now - beat.at <= HEARTBEAT_FRESH_MS &&
          (beat.maxRooms === 0 || beat.rooms < beat.maxRooms)
      )
      .sort((a, b) => score(b.beat!) - score(a.beat!))
      .map(({ i }) => i);
  }

  /**
   * Places a call: CreateCall on the best eligible node, the next on RESOURCE_EXHAUSTED or
   * UNAVAILABLE, up to 3 nodes; the last refusal when none accepts, or `no_node` when none is
   * eligible. `order` overrides the scoring (to make a full node be tried first).
   */
  async place(
    request: Record<string, unknown>,
    order?: number[]
  ): Promise<RpcResult> {
    const nodes = (order ?? this.eligible()).slice(0, MAX_PLACEMENT_TRIES);
    let last: RpcResult = {
      ok: false,
      node: -1,
      code: "RESOURCE_EXHAUSTED",
      reason: "no_node"
    };
    for (const i of nodes) {
      last = await this.call(i, "CreateCall", request);
      this.attempts.push({
        node: i,
        node_ref: this.nodes()[i].nodeRef,
        code: last.ok ? "OK" : (last.code ?? "UNKNOWN")
      });
      if (last.ok) return last;
      if (last.code !== "RESOURCE_EXHAUSTED" && last.code !== "UNAVAILABLE")
        return last;
    }
    return last;
  }

  close() {
    for (const c of this.clients.values()) c.close();
    this.clients.clear();
  }
}

function score(b: Beat) {
  return b.maxRooms ? 1 - b.rooms / b.maxRooms : 1;
}
