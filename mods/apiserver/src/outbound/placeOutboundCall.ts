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
 * `room.create` on the least-loaded node, `gateway.outbound` so a gateway opens the app session
 * on `call.answered`, then `participant.dial` through Routr with the headers Routr routes
 * API-originated calls by (X-Dod-Number picks the trunk).
 */
export async function placeOutboundCall(
  request: Requester,
  nodes: NodeDirectory,
  call: OutboundCallRequest
): Promise<{ nodeId: string; roomRef: string }> {
  const nodeId = nodes.pick();
  if (!nodeId) {
    throw new PlacementError(
      "no_media_node",
      "no live media node to place the call on"
    );
  }
  const commands = `media.${nodeId}.commands`;
  const command = async (body: Record<string, unknown>) => {
    const reply = await request(commands, body, REPLY_TIMEOUT_MS);
    if (reply.type !== "ack") {
      throw new PlacementError(
        String(reply.code ?? "error"),
        `${body.type} failed on ${nodeId}: ${reply.code ?? "error"}`
      );
    }
    return reply;
  };

  const room = await command({ type: "room.create", id: `${call.ref}:room` });
  const roomRef = String(room.roomRef ?? "");
  nodes.placed(nodeId);
  const endRoom = () =>
    command({ type: "room.end", id: `${call.ref}:end`, roomRef }).catch(
      () => undefined
    );

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
    await command({
      type: "participant.dial",
      id: `${call.ref}:dial`,
      roomRef,
      to: call.to,
      from: call.from,
      timeout: call.timeout,
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
