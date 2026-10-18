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
  DialStatus,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject } from "@fonoster/types";
import { NatsConnection } from "nats";
import { CALL_EVENTS_WILDCARD, NODE_HEARTBEAT_WILDCARD } from "../envs";
import { CallStream, TrackCallResponse } from "./types";

const FINAL_STATUSES = [
  DialStatus.BUSY,
  DialStatus.FAILED,
  DialStatus.NOANSWER
];

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** Statuses that arrive before TrackCall subscribes are kept this long and replayed. */
const KEEP_MS = 120_000;

/** Timings of TrackCall's own end of a call (control-plane, "TrackCall always ends"). */
export const TRACK_CALL_DEFAULTS = {
  /** A stream whose call never reached a media node (no node in this long) ends FAILED. */
  noNodeMs: 30_000,
  /** The call's media node is gone after this long without its heartbeat (3 beats of 2 s). */
  nodeStaleMs: 6_000,
  /** No call outlives the media node's MaxDuration (4 h); a stream ends FAILED after this. */
  maxMs: 4 * 60 * 60_000 + 5 * 60_000,
  /** How often open streams are checked. */
  sweepMs: 1_000
};

export type TrackCallOptions = Partial<typeof TRACK_CALL_DEFAULTS> & {
  now?: () => number;
};

type TrackMessage = Partial<TrackCallResponse> & {
  ref: string;
  /** The call is over (the room ended): close the stream. */
  final?: boolean;
  /** The media node that holds the call's room, when the message says. */
  nodeId?: string;
};

/** media-control `call.progress` statuses → the Calls API's DialStatus names. */
const PROGRESS: Record<string, DialStatus> = {
  ringing: DialStatus.PROGRESS,
  busy: DialStatus.BUSY,
  no_answer: DialStatus.NOANSWER,
  failed: DialStatus.FAILED
};

/**
 * One message on `calls.<ref>.events` as a TrackCall message: the control plane's `{ref,
 * status}` as is, and the media node's call.progress, call.answered and room.ended translated.
 * Undefined for anything else.
 */
function toTrackMessage(
  event: Record<string, unknown>,
  subject = ""
): TrackMessage | undefined {
  const fromSubject = subject.split(".")[1];
  const ref = String(event.ref ?? event.callRef ?? fromSubject ?? "");
  if (!ref) return undefined;
  const node =
    typeof event.nodeId === "string" && event.nodeId
      ? { nodeId: event.nodeId }
      : {};
  switch (event.type) {
    case "call.progress":
      return {
        ref,
        status: PROGRESS[String(event.status)] ?? DialStatus.FAILED,
        ...node
      };
    case "call.answered":
      return { ref, status: DialStatus.ANSWER, ...node };
    case "room.ended":
      return { ref, final: true, ...node };
    case undefined:
      // The control plane's {ref, status}, {ref, final} and {ref, nodeId} (the room exists).
      return event.status !== undefined || event.final === true || node.nodeId
        ? ({ ...event, ref } as TrackMessage)
        : undefined;
    default:
      return undefined;
  }
}

/** One open TrackCall stream. */
type Tracked = {
  ref: string;
  stream: CallStream;
  startedAt: number;
  /** The media node holding the call's room, and when this stream learned it. */
  nodeId?: string;
  nodeAt?: number;
};

/**
 * TrackCall: status updates of an API-originated call, from the call's own subject
 * `calls.<ref>.events`. The replica that placed the call publishes TRYING (and FAILED), and the
 * media node publishes the room's call events there, so any replica serves TrackCall for any
 * call, even after the placing replica is gone. The SDK subscribes right after CreateCall
 * returns, and the first statuses can come before that, so each call's messages are kept for a
 * while and replayed (also to a second TrackCall for the same call).
 *
 * Every stream ends: on the call's final status, when the client goes away, with FAILED when
 * the call's media node stops sending heartbeats (or says node.down) before the final, when no
 * node ever takes the call, or after `maxMs` at most.
 */
function createTrackCallHandler(
  nc: NatsConnection,
  options: TrackCallOptions = {}
) {
  const o = { ...TRACK_CALL_DEFAULTS, ...options };
  const now = options.now ?? Date.now;
  const tracked = new Map<string, Set<Tracked>>();
  /** Recent messages per call (insertion order is first-seen order). */
  const recent = new Map<string, { at: number; messages: TrackMessage[] }>();
  /** Last heartbeat per media node. */
  const beats = new Map<string, number>();
  const subscription = nc.subscribe(CALL_EVENTS_WILDCARD);

  const untrack = (t: Tracked) => {
    const set = tracked.get(t.ref);
    if (!set?.delete(t)) return false;
    if (set.size === 0) tracked.delete(t.ref);
    return true;
  };

  /** Ends a stream that got no final status: FAILED, then the end. */
  const fail = (t: Tracked, why: string) => {
    if (!untrack(t)) return;
    logger.warn(`TrackCall ${t.ref}: ${why}; ending with FAILED`);
    try {
      t.stream.write({ ref: t.ref, status: DialStatus.FAILED });
      t.stream.end();
    } catch {
      // the client is gone
    }
  };

  /** Writes one message; returns true when the stream is done. */
  const deliver = (t: Tracked, message: TrackMessage) => {
    const { ref, status } = message;
    if (message.nodeId && message.nodeId !== t.nodeId) {
      t.nodeId = message.nodeId;
      t.nodeAt = now();
    }
    if (status) t.stream.write({ ref, status });
    const done =
      message.final === true || (!!status && FINAL_STATUSES.includes(status));
    if (done) {
      untrack(t);
      setTimeout(() => t.stream.end(), 500);
    }
    return done;
  };

  subscription.callback = (err, msg) => {
    // We can't do much more than log the error
    if (err) {
      logger.error("call to subscription.callback", { err });
      return;
    }

    let message: TrackMessage | undefined;
    try {
      message = toTrackMessage(
        msg?.json() as Record<string, unknown>,
        msg?.subject
      );
    } catch {
      return; // not JSON
    }
    if (!message) return;
    const { ref, status } = message;

    logger.verbose("call to subscription.callback", { ref, status });

    const kept = recent.get(ref) ?? { at: now(), messages: [] };
    kept.messages.push(message);
    recent.set(ref, kept);

    for (const t of [...(tracked.get(ref) ?? [])]) deliver(t, message);
  };

  const onHeartbeat = (err: unknown, msg?: { json: () => unknown }) => {
    if (err) return;
    let event: Record<string, unknown>;
    try {
      event = msg?.json() as Record<string, unknown>;
    } catch {
      return;
    }
    const nodeId = typeof event?.nodeId === "string" ? event.nodeId : "";
    if (!nodeId) return;
    if (event.type === "node.heartbeat") beats.set(nodeId, now());
    else if (event.type === "node.down") {
      beats.delete(nodeId);
      for (const set of [...tracked.values()])
        for (const t of [...set])
          if (t.nodeId === nodeId) fail(t, `media node ${nodeId} is down`);
    }
  };

  const heartbeats = nc.subscribe(NODE_HEARTBEAT_WILDCARD, {
    callback: onHeartbeat
  });

  const sweep = () => {
    const at = now();
    for (const [ref, kept] of recent) {
      if (at - kept.at <= KEEP_MS) break;
      recent.delete(ref);
    }
    for (const [nodeId, seen] of beats)
      if (at - seen > KEEP_MS) beats.delete(nodeId);
    for (const set of [...tracked.values()])
      for (const t of [...set]) {
        if (at - t.startedAt > o.maxMs) {
          fail(t, "no final status in time");
        } else if (!t.nodeId) {
          if (at - t.startedAt > o.noNodeMs)
            fail(t, "no media node took the call");
        } else {
          const seen = Math.max(beats.get(t.nodeId) ?? 0, t.nodeAt ?? 0);
          if (at - seen > o.nodeStaleMs)
            fail(t, `media node ${t.nodeId} missed its heartbeats`);
        }
      }
  };
  const timer = setInterval(sweep, o.sweepMs);
  timer.unref?.();

  const trackCall = (call: { request: BaseApiObject }) => {
    const stream = call as unknown as CallStream;
    const { ref } = call.request;

    logger.verbose("call to trackCall", { ref });

    const t: Tracked = { ref, stream, startedAt: now() };
    let set = tracked.get(ref);
    if (!set) tracked.set(ref, (set = new Set()));
    set.add(t);
    // The client went away (cancelled the stream or lost its connection).
    for (const event of ["cancelled", "close", "error"])
      stream.on?.(event, () => untrack(t));

    for (const message of recent.get(ref)?.messages ?? [])
      if (deliver(t, message)) return;
  };

  return {
    trackCall,
    /** Open streams (tests and metrics). */
    size: () => [...tracked.values()].reduce((n, s) => n + s.size, 0),
    sweep,
    stop() {
      clearInterval(timer);
      subscription.unsubscribe?.();
      heartbeats.unsubscribe?.();
    }
  };
}

function createTrackCall(nc: NatsConnection, options?: TrackCallOptions) {
  return withErrorHandlingAndValidation(
    createTrackCallHandler(nc, options).trackCall,
    V.baseApiObjectSchema
  );
}

export { createTrackCall, createTrackCallHandler, toTrackMessage };
