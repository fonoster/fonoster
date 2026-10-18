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
import {
  natsConnectOptions,
  NatsTarget,
  Roomr,
  Sessions
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { connect, KV, NatsConnection, StringCodec } from "nats";
import {
  callEventsSubject,
  CALLS_CREATE_SUBJECT,
  DEFAULT_NATS_QUEUE_GROUP,
  NODE_HEARTBEAT_WILDCARD,
  ROUTR_MEDIA_NODE_PEER,
  ROUTR_SIP_PROXY
} from "../envs";
import { createNodeDirectory } from "./createNodeDirectory";
import { createPlacementSweep } from "./placementSweep";
import {
  OutboundCallRequest,
  OutboundTarget,
  PlacementError,
  placeOutboundCall,
  Requester
} from "./placeOutboundCall";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/** JSON request and reply over a NATS connection. */
export function natsRequester(nc: NatsConnection): Requester {
  return async (subject, body, timeoutMs) => {
    const msg = await nc.request(subject, sc.encode(JSON.stringify(body)), {
      timeout: timeoutMs
    });
    return JSON.parse(sc.decode(msg.data));
  };
}

/**
 * The control plane's part of a call's status events for TrackCall: TRYING when placement starts,
 * `{ref, node_ref}` once a node holds the call's room (TrackCall then follows that node's
 * heartbeats), and FAILED when placement fails. Everything after that (call.ringing,
 * call.answered, call.ended) comes from the media node on `roomr.events.<ref>`, so the statuses
 * keep flowing to every replica's TrackCall even if this replica dies.
 */
export function callTracker(nc: NatsConnection, ref: string) {
  const publish = (body: Record<string, unknown>) =>
    nc.publish(callEventsSubject(ref), sc.encode(JSON.stringify(body)));
  publish({ ref, status: "TRYING" });
  return {
    placed(nodeId: string) {
      publish({ ref, node_ref: nodeId });
    },
    failed() {
      publish({ ref, status: "FAILED" });
    }
  };
}

/** Routr and the media-node peer from the config (fonoster.yaml `routr`). */
function configuredTarget(): OutboundTarget {
  const { username, password } = ROUTR_MEDIA_NODE_PEER;
  return {
    proxy: ROUTR_SIP_PROXY,
    ...(password ? { auth: { username, password } } : {})
  };
}

/**
 * Serves `calls.create` (a request from CreateCall) by placing each call on the media nodes over
 * Roomr (placeOutboundCall). The reply comes once the node accepted CreateCall (`{type: "ack",
 * ref, nodeId}`), or with `{type: "error", code, message}` (`no_capacity` when no node took it),
 * so CreateCall fails at once instead of TrackCall reporting FAILED later. While a call is being
 * placed its `placements.<ref>` registry entry names the node; a replica that dies mid-placement
 * leaves it behind and the sweep (every replica) ends the call. Returns a stop function.
 */
export async function runOutboundCalls(config: {
  natsUrl?: NatsTarget;
  /** The session registry's bucket (default Sessions.SESSIONS_BUCKET; tests). */
  sessionsBucket?: string;
  nc?: NatsConnection;
  /** Roomr calls (default: a channel pool over plaintext gRPC). */
  roomr?: Roomr.RoomrCalls;
  /** Where calls are dialed (default: fonoster.yaml's routr). */
  outbound?: OutboundTarget;
  /** How long a placement entry may sit unchanged before the sweep ends its call (tests). */
  placementStaleMs?: number;
}): Promise<() => Promise<void>> {
  const nc =
    config.nc ??
    (await connect({
      ...natsConnectOptions(config.natsUrl ?? ""),
      maxReconnectAttempts: -1
    }));
  const nodes = createNodeDirectory();
  const request = natsRequester(nc);
  const pool = config.roomr ? undefined : Roomr.createRoomrPool();
  const roomr = config.roomr ?? pool!;
  const outbound = config.outbound ?? configuredTarget();

  // The session registry (add-media-node 3.2): every live node at once, then changes.
  let stopWatch: (() => void) | undefined;
  let kv: KV | undefined;
  let sweep: Awaited<ReturnType<typeof createPlacementSweep>> | undefined;
  try {
    kv = await Promise.race([
      Sessions.openSessions(nc, { bucket: config.sessionsBucket }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timed out")), 5000).unref()
      )
    ]);
    stopWatch = await Sessions.watchSessions(kv, "nodes", (e) =>
      nodes.note(
        e.value
          ? { ...e.value, node_ref: e.id, type: "node.heartbeat" }
          : { type: "node.down", node_ref: e.id },
        e.writtenAt.getTime()
      )
    );
    sweep = await createPlacementSweep({
      kv,
      roomr,
      nodeUp: (nodeRef) => nodes.live(nodeRef),
      failed: (ref) =>
        nc.publish(
          callEventsSubject(ref),
          sc.encode(JSON.stringify({ ref, status: "FAILED" }))
        ),
      staleMs: config.placementStaleMs
    });
  } catch (e) {
    logger.warn(
      `session registry unavailable (is JetStream on?); placing from heartbeats only: ${(e as Error).message}`
    );
  }

  const status = nc.subscribe(NODE_HEARTBEAT_WILDCARD, {
    callback: (err, msg) => {
      if (err) return;
      try {
        nodes.note(JSON.parse(sc.decode(msg.data)));
      } catch {
        // not a status event
      }
    }
  });

  const calls = nc.subscribe(CALLS_CREATE_SUBJECT, {
    queue: DEFAULT_NATS_QUEUE_GROUP,
    callback: (err, msg) => {
      if (err) return logger.error(err);
      let call: OutboundCallRequest;
      try {
        call = JSON.parse(sc.decode(msg.data));
      } catch {
        return;
      }
      logger.verbose("placing an outbound call", {
        ref: call.ref,
        appRef: call.appRef
      });
      // One reply per request (a plain publish, from an older CreateCall, gets none).
      let replied = !msg.reply;
      const reply = (body: Record<string, unknown>) => {
        if (replied) return;
        replied = true;
        msg.respond(sc.encode(JSON.stringify(body)));
      };
      const tracker = callTracker(nc, call.ref);
      placeOutboundCall({ roomr, request, nodes, outbound }, call, {
        onAttempt: (nodeId, controlAddr) =>
          sweep?.placing(call.ref, nodeId, controlAddr),
        onRoom: (nodeId, roomRef) => {
          tracker.placed(nodeId);
          return sweep?.placing(
            call.ref,
            nodeId,
            nodes.addressOf(nodeId) ?? "",
            roomRef
          );
        }
      }).then(
        (placed) => {
          void sweep?.placed(call.ref);
          reply({ type: "ack", ref: call.ref, nodeId: placed.nodeId });
          logger.verbose("outbound call placed", { ref: call.ref, ...placed });
        },
        (e: Error) => {
          void sweep?.placed(call.ref);
          tracker.failed();
          reply({
            type: "error",
            ref: call.ref,
            code: e instanceof PlacementError ? e.code : "error",
            message: e.message
          });
          logger.error(`outbound call ${call.ref} not placed: ${e.message}`);
        }
      );
    }
  });
  await nc.flush();

  return async () => {
    stopWatch?.();
    sweep?.stop();
    pool?.close();
    status.unsubscribe();
    calls.unsubscribe();
    if (!config.nc) await nc.drain();
  };
}
