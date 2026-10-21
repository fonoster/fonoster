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

// The per-call control stream (session.v1.Session, redesign-roomr media-control "Each call opens
// one control stream to the session endpoint"). The Roomr node is the client: it opens one
// connection per call and sends Start first; the session endpoint (AppBridge) answers with
// Answer, Ready or Reject and sends the app's commands. Audio never travels here. The proto is
// go/roomr/api/session/v1/session.proto; src/protos/session.proto is the copy
// go/roomr/api/generate.sh keeps identical.

/** The proto file this module loads. */
export const SESSION_PROTO = path.join(
  __dirname,
  "..",
  "protos",
  "session.proto"
);

/** The port AppBridge serves Session.Connect (and grpc.health.v1) on by default. */
export const SESSION_PORT = 50071;

/** The gRPC service name, as the health service reports it. */
export const SESSION_SERVICE_NAME = "session.v1.Session";

/** An RTP endpoint: `codec` is "L16/16000" on app legs; `srtpKey` (SDES, base64) when encrypted. */
export type MediaEndpoint = {
  ip: string;
  port: number;
  codec?: string;
  srtpKey?: string;
};

export type SessionSipTarget = {
  uri: string;
  proxy?: string;
  headers?: Record<string, string>;
  auth?: { username: string; password: string };
};

export type SessionStart = {
  callRef: string;
  direction: "INBOUND" | "OUTBOUND";
  from: string;
  to: string;
  /** Every INVITE header (inbound) or CreateCall's to.headers (outbound). */
  headers: Record<string, string>;
  /** CreateCall's metadata, untouched (outbound calls carry `app_ref`). */
  metadata: Record<string, string>;
  roomRef: string;
  /** The node's RTP endpoint for this call's app leg. */
  media?: MediaEndpoint;
  nodeRef: string;
};

export type SessionDtmf = { digit: string; source?: string };

export type SessionEvent = {
  participantJoined?: { participantRef: string; trackId: number };
  participantLeft?: { participantRef: string; cause: string };
  operationDone?: { operationRef: string; status: string; error?: string };
  transferResult?: { status: string; cause?: string; sipStatus?: number };
  ended?: { cause: string; sipStatus?: number };
  /** The oneof member that is set (protoLoader `oneofs: true`). */
  event?:
    | "participantJoined"
    | "participantLeft"
    | "operationDone"
    | "transferResult"
    | "ended";
};

/** A message from the node. */
export type NodeMessage = {
  start?: SessionStart;
  dtmf?: SessionDtmf;
  event?: SessionEvent;
  msg?: "start" | "dtmf" | "event";
};

export type ListenTrack = { trackId: number; rtp: MediaEndpoint };

/** A message to the node (exactly one member set). */
export type AppMessage = {
  answer?: { media: MediaEndpoint; maxDurationS?: number };
  ready?: { media: MediaEndpoint };
  reject?: { sipStatus: number; reason?: string };
  play?: { operationRef: string; url: string; loop?: boolean };
  stop?: { operationRef: string };
  transfer?: {
    to: SessionSipTarget;
    mode: "cold" | "warm" | "refer";
    music?: string;
    ringTimeoutS?: number;
  };
  transferComplete?: Record<string, never>;
  hold?: { music?: string };
  resume?: Record<string, never>;
  sendDtmf?: { digits: string };
  attachListener?: { listenerRef: string; listen: ListenTrack[] };
  detachListener?: { listenerRef: string };
  record?: { operationRef: string; destination: string };
  hangup?: { sipStatus?: number; reason?: string };
  msg?: AppMessageType;
};

export type AppMessageType =
  | "answer"
  | "ready"
  | "reject"
  | "play"
  | "stop"
  | "transfer"
  | "transferComplete"
  | "hold"
  | "resume"
  | "sendDtmf"
  | "attachListener"
  | "detachListener"
  | "record"
  | "hangup";

/** The member a message carries (the oneof's name), for logs and fakes. */
export function messageType<T extends Record<string, unknown>>(
  message: T,
  members: readonly string[]
): string | undefined {
  if (typeof message.msg === "string") return message.msg;
  return members.find((m) => message[m] !== undefined && message[m] !== null);
}

export const APP_MESSAGE_TYPES: readonly AppMessageType[] = [
  "answer",
  "ready",
  "reject",
  "play",
  "stop",
  "transfer",
  "transferComplete",
  "hold",
  "resume",
  "sendDtmf",
  "attachListener",
  "detachListener",
  "record",
  "hangup"
];

export const NODE_MESSAGE_TYPES = ["start", "dtmf", "event"] as const;

export const SESSION_EVENT_TYPES = [
  "participantJoined",
  "participantLeft",
  "operationDone",
  "transferResult",
  "ended"
] as const;

/** Ended causes the node sends (media-control "Endings carry a reason"). */
export const ENDED_CAUSES = [
  "caller_hangup",
  "callee_hangup",
  "busy",
  "no_answer",
  "rejected",
  "media_timeout",
  "node_error",
  "max_duration",
  "removed",
  "app_gone"
] as const;

let loaded: grpc.GrpcObject | undefined;

/** The session.v1 package (protoLoader options as for the other Fonoster services). */
export function sessionPackage(): grpc.GrpcObject {
  loaded ??= grpc.loadPackageDefinition(
    protoLoader.loadSync(SESSION_PROTO, {
      keepCase: false,
      longs: Number,
      enums: String,
      defaults: true,
      oneofs: true
    })
  );
  return (loaded.session as grpc.GrpcObject).v1 as grpc.GrpcObject;
}

/** The Session service definition (AppBridge serves it). */
export function sessionService(): grpc.ServiceDefinition {
  return (sessionPackage().Session as grpc.ServiceClientConstructor).service;
}

/** The Session client constructor (the node's side; fakes use it). */
export function sessionClient(): grpc.ServiceClientConstructor {
  return sessionPackage().Session as grpc.ServiceClientConstructor;
}

/** The server side of one control stream. */
export type SessionServerStream = grpc.ServerDuplexStream<
  NodeMessage,
  AppMessage
>;

/** The client side of one control stream. */
export type SessionClientStream = grpc.ClientDuplexStream<
  NodeMessage,
  AppMessage
>;
