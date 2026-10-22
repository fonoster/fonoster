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
import { status } from "@grpc/grpc-js";
import { NodeDirectory } from "./createNodeDirectory";

/** The calls.create message the Calls service publishes (CreateCall). */
export type OutboundCallRequest = {
  ref: string;
  from: string;
  to: string;
  appRef: string;
  accessKeyId: string;
  timeout?: number;
  metadata?: Record<string, unknown>;
  /** The call's region: only nodes whose heartbeat names it are eligible (unset: any node). */
  region?: string;
};

/** Where API-originated calls are dialed: the SIP proxy and the digest identity it challenges. */
export type OutboundTarget = {
  /** host:port of the SIP proxy (Routr); the INVITE goes there. */
  proxy: string;
  auth?: Roomr.SipAuth;
};

/** Nodes tried for one call before it fails with no_capacity. */
export const MAX_PLACEMENT_ATTEMPTS = 3;

/**
 * Attempts of CreateCall on the same node when the outcome is unknown (a timeout or a connection
 * lost after sending): the same call_ref and parameters, so the node dedupes it.
 */
export const SAME_NODE_ATTEMPTS = 3;

/** The PlacementError code for "no node took the call" (CreateCall's RESOURCE_EXHAUSTED). */
export const NO_CAPACITY = "no_capacity";

export class PlacementError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "PlacementError";
  }
}

/**
 * A node's refusal that sends the call to another node (control-plane "Call creation picks the
 * least-loaded Roomr node"): the node is full (RESOURCE_EXHAUSTED) or not there (UNAVAILABLE).
 */
const isRefusal = (e: unknown) =>
  e instanceof Roomr.RoomrError &&
  (e.code === status.RESOURCE_EXHAUSTED || e.code === status.UNAVAILABLE);

/** An outcome the caller cannot know (the request may have been served): retry the same node. */
const isAmbiguous = (e: unknown) =>
  !(e instanceof Roomr.RoomrError) ||
  e.code === status.DEADLINE_EXCEEDED ||
  e.code === status.CANCELLED ||
  e.code === status.UNKNOWN;

/** The PlacementError for a failed RPC: the API maps these codes to its own status codes. */
function placementError(what: string, nodeId: string, e: unknown) {
  const code =
    e instanceof Roomr.RoomrError
      ? ({
          [status.RESOURCE_EXHAUSTED]: NO_CAPACITY,
          [status.INVALID_ARGUMENT]: "invalid_argument",
          [status.ALREADY_EXISTS]: "already_exists"
        }[e.code as number] ?? "unavailable")
      : "unavailable";
  return new PlacementError(
    code,
    `${what} failed on ${nodeId}: ${(e as Error).message}`
  );
}

/** Runs `rpc`, again on the same node while its outcome is ambiguous. */
async function sameNode<T>(rpc: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await rpc();
    } catch (e) {
      if (attempt >= SAME_NODE_ATTEMPTS || !isAmbiguous(e)) throw e;
    }
  }
}

/** The Request-URI for a callee: a SIP URI as given, a number at the proxy's host. */
export function calleeUri(to: string, proxy: string) {
  if (/^sips?:/i.test(to)) return to;
  const host = proxy.replace(/:\d+$/, "");
  return `sip:${to}@${host}`;
}

/** The Roomr `metadata` of an API-originated call (AppBridge reads it at answer, 4.8). */
export function outboundMetadata(call: OutboundCallRequest) {
  return {
    app_ref: call.appRef,
    from: call.from,
    to: call.to,
    // The API caller's metadata for session.start, as JSON (metadata values are strings).
    ...(call.metadata && Object.keys(call.metadata).length
      ? { app_metadata: JSON.stringify(call.metadata) }
      : {})
  };
}

/**
 * The CreateCall request for an API-originated call: dialed through the SIP proxy with the
 * pass-through headers it routes on (`X-DOD-Number`, the caller id, picks the trunk; From is the
 * node's own identity), `to.auth` for the proxy's challenge, and the app in `metadata.app_ref`.
 */
export function createCallRequest(
  call: OutboundCallRequest,
  outbound: OutboundTarget
): Roomr.CreateCallRequest {
  return {
    callRef: call.ref,
    to: {
      uri: calleeUri(call.to, outbound.proxy),
      proxy: outbound.proxy,
      headers: {
        "X-DOD-Number": call.from,
        "X-Call-Ref": call.ref,
        "X-Access-Key-Id": call.accessKeyId,
        "X-Is-Api-Originated-Type": "true"
      },
      ...(outbound.auth ? { auth: outbound.auth } : {})
    },
    ...(call.timeout ? { ringTimeoutS: call.timeout } : {}),
    metadata: outboundMetadata(call)
  };
}

/**
 * Places an API-originated call (CreateCall) on a Roomr node over gRPC, at the heartbeat's
 * `control_addr` (control-plane "Call creation picks the least-loaded Roomr node"):
 *
 * - `CreateCall` with the call's ref on the highest-scoring eligible node. The node dials the
 *   callee, creates the room on answer and opens the call's control stream to AppBridge, which
 *   finds the app in `metadata.app_ref`; a busy, unanswered or rejected call creates no room and
 *   ends with the node's `call.ended` (the control plane's minimal record and call.failed).
 * - `RESOURCE_EXHAUSTED` or `UNAVAILABLE` sends the call to the next node, up to
 *   MAX_PLACEMENT_ATTEMPTS nodes, then `no_capacity` (synchronously: the API caller gets it).
 * - A timeout or a lost connection is ambiguous (the INVITE may be out): CreateCall is repeated on
 *   the same node with the same call_ref and parameters (the node dedupes it), never on another;
 *   still no answer after SAME_NODE_ATTEMPTS fails the call, and EndCall is sent in case the node
 *   did take it.
 *
 * `onAttempt` is told each node before anything is sent to it (the session registry's
 * `placements.<callRef>` entry, written before the RPC so a sweep can end the call if this
 * replica dies mid-placement).
 */
export async function placeOutboundCall(
  deps: {
    roomr: Roomr.RoomrCalls;
    nodes: NodeDirectory;
    outbound: OutboundTarget;
  },
  call: OutboundCallRequest,
  hooks: {
    onAttempt?: (nodeId: string, controlAddr: string) => unknown;
  } = {}
): Promise<{ nodeId: string; roomRef: string; callRef: string }> {
  const { roomr, nodes } = deps;
  const request = createCallRequest(call, deps.outbound);
  const tried = new Set<string>();
  while (tried.size < MAX_PLACEMENT_ATTEMPTS) {
    const nodeId = nodes.pick(tried, call.region);
    if (!nodeId) break;
    tried.add(nodeId);
    const addr = nodes.addressOf(nodeId)!;
    await hooks.onAttempt?.(nodeId, addr);
    try {
      const placed = await sameNode(() => roomr.createCall(addr, request));
      nodes.placed(nodeId);
      return { nodeId, roomRef: placed.roomRef, callRef: placed.callRef };
    } catch (e) {
      if (isRefusal(e)) {
        nodes.refused(
          nodeId,
          (e as Roomr.RoomrError).code === status.UNAVAILABLE
            ? "unavailable"
            : "at_capacity"
        );
        continue;
      }
      // Anything else fails the call: only a refusal says the node did nothing. After an
      // ambiguous outcome the node may hold the call; end it (the API caller gets an error).
      if (isAmbiguous(e))
        await roomr.endCall(addr, { callRef: call.ref }).catch(() => undefined);
      throw placementError("CreateCall", nodeId, e);
    }
  }
  throw new PlacementError(
    NO_CAPACITY,
    tried.size === 0
      ? "no Roomr node has room for the call"
      : `no Roomr node took the call (tried ${[...tried].join(", ")})`
  );
}
