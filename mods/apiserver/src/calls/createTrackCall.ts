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
import {
  CALL_EVENTS_WILDCARD,
  MEDIA_CALL_EVENTS_WILDCARD,
  NODE_HEARTBEAT_WILDCARD
} from "../envs";
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
  /** The media node that holds the call, when the message says. */
  nodeRef?: string;
};

/** call.ended causes of an unanswered call → the Calls API's DialStatus names (else FAILED). */
const UNANSWERED: Record<string, DialStatus> = {
  busy: DialStatus.BUSY,
  no_answer: DialStatus.NOANSWER
};

/**
 * One message as a TrackCall message: the control plane's `{ref, status}` (on
 * `calls.<ref>.events`) as is, and the media node's call.ringing, call.answered and call.ended
 * (on `roomr.events.<call_ref>`) translated. Undefined for anything else (receivers ignore
 * unknown event types).
 */
function toTrackMessage(
  event: Record<string, unknown>,
  subject = ""
): TrackMessage | undefined {
  const tokens = subject.split(".");
  const fromSubject = tokens[0] === "roomr" ? tokens[2] : tokens[1];
  const ref = String(event.ref ?? event.call_ref ?? fromSubject ?? "");
  if (!ref) return undefined;
  const node =
    typeof event.node_ref === "string" && event.node_ref
      ? { nodeRef: event.node_ref }
      : {};
  switch (event.type) {
    case "call.started":
      return node.nodeRef ? { ref, ...node } : undefined;
    case "call.ringing":
      return { ref, status: DialStatus.PROGRESS, ...node };
    case "call.answered":
      return { ref, status: DialStatus.ANSWER, ...node };
    case "call.ended":
      // An answered call just ends; an unanswered one ends with its dial status.
      return event.answered === true
        ? { ref, final: true, ...node }
        : {
            ref,
            status: UNANSWERED[String(event.cause)] ?? DialStatus.FAILED,
            final: true,
            ...node
          };
    case undefined:
      // The control plane's {ref, status}, {ref, final} and {ref, node_ref} (a node took it).
      return event.status !== undefined || event.final === true || node.nodeRef
        ? ({
            ref,
            ...(event.status !== undefined ? { status: event.status } : {}),
            ...(event.final === true ? { final: true } : {}),
            ...node
          } as TrackMessage)
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
  /** The media node holding the call, and when this stream learned it. */
  nodeRef?: string;
  nodeAt?: number;
};

/**
 * TrackCall: status updates of an API-originated call, from the call's own subjects. The replica
 * that placed the call publishes TRYING (and FAILED) on `calls.<ref>.events`, and the media node
 * publishes the call's events on `roomr.events.<ref>`, so any replica serves TrackCall for any
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
  const mediaEvents = nc.subscribe(MEDIA_CALL_EVENTS_WILDCARD);

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
    if (message.nodeRef && message.nodeRef !== t.nodeRef) {
      t.nodeRef = message.nodeRef;
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

  const onEvent = (
    err: unknown,
    msg?: { json: () => unknown; subject: string }
  ) => {
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
  subscription.callback = onEvent;
  mediaEvents.callback = onEvent;

  const onHeartbeat = (err: unknown, msg?: { json: () => unknown }) => {
    if (err) return;
    let event: Record<string, unknown>;
    try {
      event = msg?.json() as Record<string, unknown>;
    } catch {
      return;
    }
    const nodeRef = typeof event?.node_ref === "string" ? event.node_ref : "";
    if (!nodeRef) return;
    if (event.type === "node.heartbeat") beats.set(nodeRef, now());
    else if (event.type === "node.down") {
      beats.delete(nodeRef);
      for (const set of [...tracked.values()])
        for (const t of [...set])
          if (t.nodeRef === nodeRef) fail(t, `media node ${nodeRef} is down`);
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
    for (const [nodeRef, seen] of beats)
      if (at - seen > KEEP_MS) beats.delete(nodeRef);
    for (const set of [...tracked.values()])
      for (const t of [...set]) {
        if (at - t.startedAt > o.maxMs) {
          fail(t, "no final status in time");
        } else if (!t.nodeRef) {
          if (at - t.startedAt > o.noNodeMs)
            fail(t, "no media node took the call");
        } else {
          const seen = Math.max(beats.get(t.nodeRef) ?? 0, t.nodeAt ?? 0);
          if (at - seen > o.nodeStaleMs)
            fail(t, `media node ${t.nodeRef} missed its heartbeats`);
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
      mediaEvents.unsubscribe?.();
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
