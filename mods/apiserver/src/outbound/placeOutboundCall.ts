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

/** The slice of a NATS connection placement needs: JSON request and reply. */
export type Requester = (
  subject: string,
  body: Record<string, unknown>,
  timeoutMs: number
) => Promise<Record<string, unknown>>;

/** Where API-originated calls are dialed: the SIP proxy and the digest identity it challenges. */
export type OutboundTarget = {
  /** host:port of the SIP proxy (Routr); the INVITE goes there. */
  proxy: string;
  auth?: Roomr.SipAuth;
};

/** The gateway subject that opens the app session when the callee answers (gateway B8). */
export const GATEWAY_OUTBOUND_SUBJECT = "gateway.outbound";

const REPLY_TIMEOUT_MS = 2000;

/** Nodes tried for one call before it fails with no_capacity. */
export const MAX_PLACEMENT_ATTEMPTS = 3;

/** Attempts of one RPC on the same node when the outcome is unknown (a timeout). */
export const SAME_NODE_ATTEMPTS = 2;

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

/** A node's refusal that sends the call to another node (decision 3). */
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

/**
 * Places an API-originated call (CreateCall) on the Roomr nodes over Roomr (gRPC, at the
 * heartbeat's `control_addr`):
 *
 * 1. `CreateRoom` with the call's ref on the highest-scoring eligible node. `RESOURCE_EXHAUSTED`
 *    or `UNAVAILABLE` sends the call to the next node, up to MAX_PLACEMENT_ATTEMPTS nodes, then
 *    `no_capacity`; a timeout is retried on the same node (the ref makes the retry safe) and
 *    then fails the call.
 * 2. `gateway.outbound`, so a gateway watches the room and opens the app's session on
 *    `call.answered` (until the control stream replaces it, tasks 5 and 6).
 * 3. `CreateCall` into that room with the call's ref (repeated on a timeout: the node dedupes
 *    it), dialing through the SIP proxy with the pass-through headers it routes on
 *    (`X-DOD-Number` picks the trunk) and `to.auth` for its challenge.
 *
 * `onAttempt` is told each node before anything is sent to it (the session registry entry that
 * lets a sweep end the call if this replica dies mid-placement); `onRoom` once the room exists.
 */
export async function placeOutboundCall(
  deps: {
    roomr: Roomr.RoomrCalls;
    request: Requester;
    nodes: NodeDirectory;
    outbound: OutboundTarget;
  },
  call: OutboundCallRequest,
  hooks: {
    onAttempt?: (nodeId: string, controlAddr: string) => unknown;
    onRoom?: (nodeId: string, roomRef: string) => unknown;
  } = {}
): Promise<{ nodeId: string; roomRef: string; callRef: string }> {
  const { roomr, nodes } = deps;
  const tried = new Set<string>();
  let placedOn: { nodeId: string; addr: string; roomRef: string } | undefined;
  while (!placedOn && tried.size < MAX_PLACEMENT_ATTEMPTS) {
    const nodeId = nodes.pick(tried, call.region);
    if (!nodeId) break;
    tried.add(nodeId);
    const addr = nodes.addressOf(nodeId)!;
    await hooks.onAttempt?.(nodeId, addr);
    try {
      const room = await sameNode(() =>
        roomr.createRoom(addr, { roomRef: call.ref }).catch((e) => {
          // A retried CreateRoom finds the room its first try made.
          if (e instanceof Roomr.RoomrError && e.code === status.ALREADY_EXISTS)
            return { roomRef: call.ref };
          throw e;
        })
      );
      placedOn = { nodeId, addr, roomRef: room.roomRef };
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
      // Anything else, a timeout after its retries included, fails the call: only a refusal
      // says the node did nothing.
      throw placementError("CreateRoom", nodeId, e);
    }
  }
  if (!placedOn) {
    throw new PlacementError(
      NO_CAPACITY,
      tried.size === 0
        ? "no Roomr node has room for the call"
        : `no Roomr node took the call (tried ${[...tried].join(", ")})`
    );
  }
  const { nodeId, addr, roomRef } = placedOn;
  nodes.placed(nodeId);
  await hooks.onRoom?.(nodeId, roomRef);
  const endRoom = () => roomr.endRoom(addr, { roomRef }).catch(() => undefined);

  let claimed: Record<string, unknown>;
  try {
    claimed = await deps.request(
      GATEWAY_OUTBOUND_SUBJECT,
      {
        nodeId,
        roomRef,
        appRef: call.appRef,
        callRef: call.ref,
        from: call.from,
        to: call.to,
        metadata: call.metadata ?? {}
      },
      REPLY_TIMEOUT_MS
    );
  } catch (e) {
    await endRoom();
    throw new PlacementError(
      "no_gateway",
      `no gateway took the call: ${(e as Error).message}`
    );
  }
  if (claimed.type !== "ack") {
    await endRoom();
    throw new PlacementError(
      String(claimed.code ?? "error"),
      `the gateway refused the call: ${claimed.code ?? "error"}`
    );
  }

  try {
    const placed = await sameNode(() =>
      roomr.createCall(addr, {
        callRef: call.ref,
        roomRef,
        // From is the node's own SIP identity (its registration): the caller-id travels in
        // X-DOD-Number, which picks the trunk.
        to: {
          uri: calleeUri(call.to, deps.outbound.proxy),
          proxy: deps.outbound.proxy,
          headers: {
            "X-DOD-Number": call.from,
            "X-Call-Ref": call.ref,
            "X-Access-Key-Id": call.accessKeyId,
            "X-Is-Api-Originated-Type": "true"
          },
          ...(deps.outbound.auth ? { auth: deps.outbound.auth } : {})
        },
        ringTimeoutS: call.timeout,
        metadata: { app_ref: call.appRef }
      })
    );
    return { nodeId, roomRef, callRef: placed.callRef };
  } catch (e) {
    await roomr.endCall(addr, { callRef: call.ref }).catch(() => undefined);
    await endRoom();
    throw placementError("CreateCall", nodeId, e);
  }
}
