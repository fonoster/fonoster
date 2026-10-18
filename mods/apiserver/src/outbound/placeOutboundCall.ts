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

/** The gateway subject that opens the app session when the callee answers (gateway B8). */
export const GATEWAY_OUTBOUND_SUBJECT = "gateway.outbound";

const REPLY_TIMEOUT_MS = 2000;

/** Nodes tried for one call before it fails with no_capacity. */
export const MAX_PLACEMENT_ATTEMPTS = 3;

/** The PlacementError code for "no node took the call" (CreateCall's RESOURCE_EXHAUSTED). */
export const NO_CAPACITY = "no_capacity";

/** room.create refusals that send the call to the next node. */
const TRY_NEXT = new Set(["at_capacity", "draining"]);

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
 * Places an API-originated call (CreateCall) on the media nodes, replacing Asterisk's originate:
 * `room.create` on the highest-scoring eligible node (the next one, up to MAX_PLACEMENT_ATTEMPTS
 * nodes, when a node is full, draining or silent), `gateway.outbound` so a gateway opens the app
 * session on `call.answered`, then `participant.dial` through Routr with the headers Routr
 * routes API-originated calls by (X-Dod-Number picks the trunk). The room carries the call's
 * ref, so the node also publishes the call's events on `roomr.events.<ref>` (TrackCall).
 */
export async function placeOutboundCall(
  request: Requester,
  nodes: NodeDirectory,
  call: OutboundCallRequest,
  hooks: {
    /** Called once the room exists, before anything is dialed (e.g. to watch its events). */
    onRoom?: (nodeId: string, roomRef: string) => void;
  } = {}
): Promise<{ nodeId: string; roomRef: string }> {
  const command = async (nodeId: string, body: Record<string, unknown>) => {
    const reply = await request(
      `media.${nodeId}.commands`,
      body,
      REPLY_TIMEOUT_MS
    );
    if (reply.type !== "ack") {
      throw new PlacementError(
        String(reply.code ?? "error"),
        `${body.type} failed on ${nodeId}: ${reply.code ?? "error"}`
      );
    }
    return reply;
  };

  // room.create on the highest-scoring eligible node; a full, draining or silent node sends the
  // call to the next one.
  const tried = new Set<string>();
  let placedOn: { nodeId: string; roomRef: string } | undefined;
  while (!placedOn && tried.size < MAX_PLACEMENT_ATTEMPTS) {
    const candidate = nodes.pick(tried, call.region);
    if (!candidate) break;
    tried.add(candidate);
    try {
      const room = await command(candidate, {
        type: "room.create",
        id: `${call.ref}:room`,
        callRef: call.ref
      });
      placedOn = { nodeId: candidate, roomRef: String(room.roomRef ?? "") };
    } catch (e) {
      if (e instanceof PlacementError) {
        if (!TRY_NEXT.has(e.code)) throw e;
        nodes.refused(candidate, e.code);
      }
      // Otherwise no reply in time: the node is gone or stuck; try the next one.
    }
  }
  if (!placedOn) {
    throw new PlacementError(
      NO_CAPACITY,
      tried.size === 0
        ? "no media node has room for the call"
        : `no media node took the call (tried ${[...tried].join(", ")})`
    );
  }
  const { nodeId, roomRef } = placedOn;
  nodes.placed(nodeId);
  hooks.onRoom?.(nodeId, roomRef);
  const endRoom = () =>
    command(nodeId, {
      type: "room.end",
      id: `${call.ref}:end`,
      roomRef
    }).catch(() => undefined);

  let claimed: Record<string, unknown>;
  try {
    claimed = await request(
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
    await command(nodeId, {
      type: "participant.dial",
      id: `${call.ref}:dial`,
      roomRef,
      to: call.to,
      from: call.from,
      timeout: call.timeout,
      // The gateway that will own the call: the node ends the room if that gateway goes away.
      ...(typeof claimed.gatewayRef === "string"
        ? { gatewayRef: claimed.gatewayRef }
        : {}),
      headers: {
        "X-Call-Ref": call.ref,
        "X-Dod-Number": call.from,
        "X-Access-Key-Id": call.accessKeyId,
        "X-Is-Api-Originated-Type": "true"
      }
    });
  } catch (e) {
    await endRoom();
    throw e;
  }
  return { nodeId, roomRef };
}
