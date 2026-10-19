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
import { createHash } from "crypto";
import { Sessions, Webhooks } from "@fonoster/common";

/** `call.ended`'s `endReason` when AppBridge that owned the call died mid-call. */
export const APPBRIDGE_LOST_REASON = "appbridge-lost";

/**
 * The `call.ended` the control plane sends for a call whose AppBridge is gone. Its id depends on
 * the call only, so every replica that detects the loss builds the same event and the fan-out
 * stores one delivery per endpoint (delivery ids depend on the event id): delivered once.
 */
export function lostCallEnded(
  call: Record<string, unknown>,
  lastSeenAt: number
): Webhooks.WebhookEvent | undefined {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const callRef = str(call.callRef);
  const appRef = str(call.appRef);
  // Only a call that reached an app gets call.ended (voice-session).
  if (!callRef || !appRef) return undefined;
  const startedAt = Date.parse(str(call.startedAt));
  const event = Webhooks.callEnded("", {
    callRef,
    appRef,
    from: str(call.from),
    to: str(call.to),
    direction: call.direction === "outbound" ? "outbound" : "inbound",
    durationSeconds: Number.isFinite(startedAt)
      ? Math.max(0, Math.round((lastSeenAt - startedAt) / 1000))
      : 0,
    endReason: APPBRIDGE_LOST_REASON
  });
  const digest = createHash("sha256")
    .update(`appbridge-lost\n${callRef}`)
    .digest("hex")
    .slice(0, 32);
  return { ...event, id: `evt_lost_${digest}` };
}

/**
 * Finds calls whose AppBridge died mid-call, from the session registry: an appbridge rewrites its
 * `appbridges.<ref>` entry and each of its `calls.<callRef>` entries every SESSIONS_REFRESH_MS and
 * deletes a call's entry when the call ends. A call entry not rewritten for `staleMs` (the lease
 * TTL) whose AppBridge's entry is not rewritten either is a lost call: `emit` gets its
 * `call.ended` (reason `appbridge-lost`) and the call is forgotten. Times are when this replica
 * saw each write, so a replica that just started waits a full `staleMs` before judging.
 */
export function createLostCallSweep(deps: {
  emit: (event: Webhooks.WebhookEvent) => unknown;
  staleMs?: number;
  now?: () => number;
}) {
  const staleMs = deps.staleMs ?? Sessions.SESSIONS_TTL_MS;
  const now = deps.now ?? Date.now;
  const calls = new Map<
    string,
    { value: Record<string, unknown>; seenAt: number }
  >();
  const appbridges = new Map<string, number>();

  const onEntry = (e: Sessions.SessionEntry) => {
    if (e.kind === "calls") {
      if (e.value) calls.set(e.id, { value: e.value, seenAt: now() });
      else calls.delete(e.id); // ended: its AppBridge sent call.ended
    } else if (e.kind === "appbridges") {
      if (e.value) appbridges.set(e.id, now());
      else appbridges.delete(e.id);
    }
  };

  const sweep = () => {
    const at = now();
    const lost: Webhooks.WebhookEvent[] = [];
    for (const [id, c] of calls) {
      if (at - c.seenAt <= staleMs) continue;
      // Watched ids are the key after `appbridges.` (sanitized like the key).
      const bridgeId = Sessions.sessionKey(
        "appbridges",
        String(c.value.bridgeRef ?? "")
      ).slice("appbridges.".length);
      const appBridgeSeen = appbridges.get(bridgeId) ?? 0;
      // AppBridge is alive: it will rewrite the entry (or delete it when the call ends).
      if (at - appBridgeSeen <= staleMs) continue;
      calls.delete(id);
      const event = lostCallEnded(c.value, c.seenAt);
      if (!event) continue;
      lost.push(event);
      deps.emit(event);
    }
    return lost;
  };

  return { onEntry, sweep, size: () => calls.size };
}
