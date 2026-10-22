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
import * as path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

// The controller's side of Roomr (roomr.v1.Roomr, redesign-roomr "Roomr is a gRPC service
// with three nouns"). The proto is go/roomr/api/roomr/v1/roomr.proto; src/protos/roomr.proto is
// the copy go/roomr/api/generate.sh keeps identical.

/** The proto file this package loads. */
export const ROOMR_PROTO = path.join(__dirname, "..", "protos", "roomr.proto");

export type SipAuth = { username: string; password: string };

export type SipTarget = {
  uri: string;
  proxy?: string;
  headers?: Record<string, string>;
  auth?: SipAuth;
};

export type CreateCallRequest = {
  callRef?: string;
  to: SipTarget;
  from?: string;
  roomRef?: string;
  session?: string;
  ringTimeoutS?: number;
  /** Passed through untouched in the events for this call (e.g. { app_ref }). */
  metadata?: Record<string, string>;
  maxDurationS?: number;
};

export type Call = {
  callRef: string;
  roomRef: string;
  state: "RINGING" | "ANSWERED" | "ENDED";
  participantRef: string;
};

export type CreateRoomRequest = {
  roomRef?: string;
  maxDurationS?: number;
  /** Overrides the node's emptyRoomTimeout for this room (0: the node's). */
  emptyTimeoutS?: number;
  /** Overrides the node's maxParticipants for this room (0: the node's). */
  maxParticipants?: number;
};
export type Room = { roomRef: string };

/** The RPCs the control plane uses, each against one node's control address. */
export type RoomrCalls = {
  createCall(addr: string, request: CreateCallRequest): Promise<Call>;
  createRoom(addr: string, request: CreateRoomRequest): Promise<Room>;
  endCall(addr: string, request: { callRef: string }): Promise<void>;
  endRoom(addr: string, request: { roomRef: string }): Promise<void>;
};

/** A failed RPC, with its gRPC status code. */
export class RoomrError extends Error {
  constructor(
    readonly code: grpc.status,
    message: string
  ) {
    super(message);
    this.name = "RoomrError";
  }
}

let loaded: grpc.GrpcObject | undefined;

/** The roomr.v1 package (protoLoader options as for the other Fonoster services). */
export function roomrPackage(): grpc.GrpcObject {
  loaded ??= grpc.loadPackageDefinition(
    protoLoader.loadSync(ROOMR_PROTO, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    })
  );
  return (loaded.roomr as grpc.GrpcObject).v1 as grpc.GrpcObject;
}

/** The Roomr service definition (fakes serve it). */
export function roomrService(): grpc.ServiceDefinition {
  return (roomrPackage().Roomr as grpc.ServiceClientConstructor).service;
}

/** Each call's deadline (ms). */
export const ROOMR_DEADLINE_MS = 2000;

type Unary<Req, Res> = (
  request: Req,
  options: grpc.CallOptions,
  callback: (err: grpc.ServiceError | null, response: Res) => void
) => void;

/**
 * One gRPC channel per node address, reused by every call to it, with HTTP/2 keepalive and a
 * deadline per call. Plaintext: the control port is reachable only inside the deployment's
 * network. `close()` closes every channel.
 */
export function createRoomrPool(
  options: { deadlineMs?: number } = {}
): RoomrCalls & { close(): void } {
  const Client = roomrPackage().Roomr as grpc.ServiceClientConstructor;
  const clients = new Map<string, grpc.Client>();
  const client = (addr: string) => {
    let c = clients.get(addr);
    if (!c) {
      c = new Client(addr, grpc.credentials.createInsecure(), {
        "grpc.keepalive_time_ms": 10_000,
        "grpc.keepalive_timeout_ms": 5_000,
        "grpc.keepalive_permit_without_calls": 1
      });
      clients.set(addr, c);
    }
    return c;
  };
  const call =
    <Req, Res>(method: string) =>
    (addr: string, request: Req): Promise<Res> =>
      new Promise((resolve, reject) => {
        const rpc = (
          client(addr) as unknown as Record<string, Unary<Req, Res>>
        )[method].bind(client(addr));
        rpc(
          request,
          { deadline: Date.now() + (options.deadlineMs ?? ROOMR_DEADLINE_MS) },
          (err, res) =>
            err ? reject(new RoomrError(err.code, err.details)) : resolve(res)
        );
      });
  const empty =
    <Req>(method: string) =>
    async (addr: string, request: Req) => {
      await call<Req, unknown>(method)(addr, request);
    };
  return {
    createCall: call<CreateCallRequest, Call>("CreateCall"),
    createRoom: call<CreateRoomRequest, Room>("CreateRoom"),
    endCall: empty<{ callRef: string }>("EndCall"),
    endRoom: empty<{ roomRef: string }>("EndRoom"),
    close() {
      for (const c of clients.values()) c.close();
      clients.clear();
    }
  };
}

export * from "./health";
export * from "./session";
