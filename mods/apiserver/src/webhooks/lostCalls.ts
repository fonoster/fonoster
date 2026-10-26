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
import { Sessions, Webhooks } from "@fonoster/common";

/** `call.ended`'s `endReason` when AppBridge that owned the call died mid-call. */
export const APPBRIDGE_LOST_REASON = "appbridge-lost";

/**
 * The `call.ended` the control plane sends for a call whose AppBridge is gone (the node ended it
 * with cause `app_gone`). Its id depends on the call only (`Webhooks.callEndedId`), so every
 * replica that detects the loss builds the same event, and so does an AppBridge that sent its own
 * `call.ended` just before it died: the fan-out stores one delivery per endpoint (delivery ids
 * depend on the event id) and the first one wins.
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
  return Webhooks.callEnded("", {
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
}

/** How long after the node's `app_gone` an AppBridge's own end of the call may still show up. */
export const APP_GONE_GRACE_MS = 2_000;

/**
 * How long a call entry is remembered after its last write: an AppBridge rewrites its entries
 * every SESSIONS_REFRESH_MS, and the node reports `app_gone` well within this after its AppBridge
 * stops (stream break at once, keepalive or media timeout within seconds).
 */
export const LOST_CALL_FORGET_MS = 5 * 60_000;

/**
 * Calls whose AppBridge died mid-call (redesign-roomr 15.4, workspace-webhooks "AppBridge dies
 * mid-call"). AppBridge writes `calls.<callRef>` (with the app and parties once the call reached
 * an app) and deletes it when the call ends, right after it sent its own `call.ended`. When the
 * Roomr node ends a call with cause `app_gone` (its control stream broke, or the app leg went
 * silent), `onAppGone` waits `graceMs` for that delete and then, if the entry was not deleted (it
 * is still there, or it expired with the AppBridge that kept it alive), `emit` gets the call's
 * `call.ended` with `endReason` `appbridge-lost`. Its id depends on the call only, so the event is
 * delivered once per endpoint across replicas; a call AppBridge ended itself gets none.
 *
 * Entries are remembered as this replica saw them on the registry watch (an entry that expires is
 * not reported by the watch, so it stays here until `forgetMs` after its last write).
 */
export function createLostCalls(deps: {
  emit: (event: Webhooks.WebhookEvent) => unknown;
  graceMs?: number;
  forgetMs?: number;
  now?: () => number;
}) {
  const graceMs = deps.graceMs ?? APP_GONE_GRACE_MS;
  const forgetMs = deps.forgetMs ?? LOST_CALL_FORGET_MS;
  const now = deps.now ?? Date.now;
  const calls = new Map<
    string,
    { value: Record<string, unknown>; seenAt: number }
  >();
  /** Calls already reported here (a repeated app_gone sends nothing more). */
  const reported = new Map<string, number>();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const forget = () => {
    const at = now();
    for (const [id, c] of calls) if (at - c.seenAt > forgetMs) calls.delete(id);
    for (const [id, t] of reported) if (at - t > forgetMs) reported.delete(id);
  };

  /** One `calls.*` registry entry (a put, or a delete when the call ended normally). */
  const onEntry = (e: Sessions.SessionEntry) => {
    if (e.kind !== "calls") return;
    if (e.value) calls.set(e.id, { value: e.value, seenAt: now() });
    else calls.delete(e.id); // ended: its AppBridge sent call.ended
    if (calls.size % 256 === 0) forget();
  };

  /** Reports the call now if its entry is still known; returns its event. */
  const report = (callRef: string) => {
    const id = Sessions.sessionKey("calls", callRef).slice("calls.".length);
    const c = calls.get(id);
    if (!c || reported.has(id)) return undefined;
    calls.delete(id);
    reported.set(id, now());
    const event = lostCallEnded(c.value, now());
    if (event) deps.emit(event);
    return event;
  };

  return {
    onEntry,
    /**
     * The node ended `callRef` with cause `app_gone`: after `graceMs` (an AppBridge that ended the
     * call itself deletes its entry by then) the call's `call.ended` (appbridge-lost) is sent.
     * Resolves with the event, or undefined when there is none to send.
     */
    onAppGone(callRef: string): Promise<Webhooks.WebhookEvent | undefined> {
      if (graceMs <= 0) return Promise.resolve(report(callRef));
      return new Promise((resolve) => {
        const t = setTimeout(() => {
          timers.delete(t);
          resolve(report(callRef));
        }, graceMs);
        timers.add(t);
      });
    },
    /** Drops what is remembered past `forgetMs` (also done as entries arrive). */
    forget,
    size: () => calls.size,
    stop() {
      timers.forEach(clearTimeout);
      timers.clear();
    }
  };
}

export type LostCalls = ReturnType<typeof createLostCalls>;
