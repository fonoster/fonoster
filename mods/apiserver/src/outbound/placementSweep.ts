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
import { Roomr, Sessions } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { status } from "@grpc/grpc-js";
import type { KV } from "nats";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/**
 * A placement entry older than this was left by a replica that died mid-placement: every step of
 * a placement rewrites its entry well within it (one RPC and its retry, or AppBridge request).
 */
export const PLACEMENT_STALE_MS = 10_000;

/** How often each replica looks for stale placements. */
const SWEEP_EVERY_MS = 2_000;

/**
 * Placements in the session registry (control-plane "Outbound calls are registered before they
 * are placed"): before each RPC that could start a call, the placing replica writes
 * `placements.<callRef>` = { callRef, nodeRef, controlAddr, roomRef? }, rewrites it when it moves
 * to another node, and deletes it once CreateCall has answered (or the placement failed). Every
 * replica follows the entries; one that sits unchanged for `staleMs` belongs to a replica that
 * died mid-placement (its API caller got no answer, so the call must not go on). The sweep
 * removes it, and reports the call FAILED (`failed`), when its node is down or answers
 * `NOT_FOUND` for the call; a call the node does hold is ended (EndCall, then EndRoom for the
 * room made for it). Registry writes are best effort and never fail a placement.
 */
export async function createPlacementSweep(deps: {
  kv: KV;
  roomr: Roomr.RoomrCalls;
  /** Whether the node is live (fresh heartbeat); a down node's placements fail at once. */
  nodeUp?: (nodeRef: string) => boolean;
  /** The call never got placed: its record ends FAILED (TrackCall). */
  failed?: (callRef: string) => unknown;
  staleMs?: number;
  now?: () => number;
}) {
  const staleMs = deps.staleMs ?? PLACEMENT_STALE_MS;
  const now = deps.now ?? Date.now;
  const seen = new Map<
    string,
    { value: Record<string, unknown>; seenAt: number }
  >();
  const key = (ref: string) => Sessions.sessionKey("placements", ref);
  const write = async (ref: string, value?: Record<string, unknown>) => {
    try {
      if (value) await deps.kv.put(key(ref), JSON.stringify(value));
      else await deps.kv.delete(key(ref));
    } catch (e) {
      logger.warn(
        `placement entry ${ref} not written: ${(e as Error).message}`
      );
    }
  };

  const stopWatch = await Sessions.watchSessions(deps.kv, "placements", (e) => {
    if (e.value) seen.set(e.id, { value: e.value, seenAt: now() });
    else seen.delete(e.id);
  });

  const sweep = async () => {
    const at = now();
    const ended: string[] = [];
    for (const [id, p] of [...seen]) {
      if (at - p.seenAt <= staleMs) continue;
      seen.delete(id);
      const callRef = String(p.value.callRef ?? id);
      const addr = String(p.value.controlAddr ?? "");
      const nodeRef = String(p.value.nodeRef ?? "");
      logger.warn(
        `outbound call ${callRef} was left mid-placement on ${nodeRef}; sweeping it`
      );
      let notFound = !addr || deps.nodeUp?.(nodeRef) === false;
      if (!notFound) {
        notFound = await deps.roomr.endCall(addr, { callRef }).then(
          () => false,
          (e) => e instanceof Roomr.RoomrError && e.code === status.NOT_FOUND
        );
        if (typeof p.value.roomRef === "string" && p.value.roomRef)
          await deps.roomr
            .endRoom(addr, { roomRef: p.value.roomRef })
            .catch(() => undefined);
      }
      if (notFound) await deps.failed?.(callRef);
      await write(id);
      ended.push(callRef);
    }
    return ended;
  };
  const timer = setInterval(() => void sweep(), SWEEP_EVERY_MS);
  timer.unref?.();

  return {
    /** Writes (or rewrites) the call's entry before an RPC to `nodeRef`. */
    placing(
      callRef: string,
      nodeRef: string,
      controlAddr: string,
      roomRef?: string
    ) {
      return write(callRef, {
        callRef,
        nodeRef,
        controlAddr,
        ...(roomRef ? { roomRef } : {}),
        at: new Date().toISOString()
      });
    },
    /** The placement is over (placed or failed): its entry goes. */
    placed(callRef: string) {
      return write(callRef);
    },
    /** Ends the calls of stale entries now (tests; the timer runs it too). */
    sweep,
    stop() {
      clearInterval(timer);
      stopWatch();
    }
  };
}
