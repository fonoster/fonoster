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
import { CALL_EVENTS_WILDCARD } from "../envs";
import { CallStream, TrackCallResponse } from "./types";

const FINAL_STATUSES = [
  DialStatus.BUSY,
  DialStatus.FAILED,
  DialStatus.NOANSWER
];

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** Statuses that arrive before TrackCall subscribes are kept this long and replayed. */
const KEEP_MS = 120_000;

type TrackMessage = Partial<TrackCallResponse> & {
  ref: string;
  /** The call is over (the room ended): close the stream. */
  final?: boolean;
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
  switch (event.type) {
    case "call.progress":
      return {
        ref,
        status: PROGRESS[String(event.status)] ?? DialStatus.FAILED
      };
    case "call.answered":
      return { ref, status: DialStatus.ANSWER };
    case "room.ended":
      return { ref, final: true };
    case undefined:
      return event.status !== undefined || event.final === true
        ? ({ ...event, ref } as TrackMessage)
        : undefined;
    default:
      return undefined;
  }
}

/**
 * TrackCall: status updates of an API-originated call, from the call's own subject
 * `calls.<ref>.events`. The replica that placed the call publishes TRYING (and FAILED), and the
 * media node publishes the room's call events there, so any replica serves TrackCall for any
 * call, even after the placing replica is gone. The SDK subscribes right after CreateCall
 * returns, and the first statuses can come before that, so messages for calls nobody tracks yet
 * are kept for a while and replayed.
 */
function createTrackCall(nc: NatsConnection) {
  const trackingCallsMap = new Map<string, CallStream>();
  const early = new Map<string, { at: number; messages: TrackMessage[] }>();
  const subscription = nc.subscribe(CALL_EVENTS_WILDCARD);

  /** Writes one message; returns true when the stream is done. */
  const deliver = (stream: CallStream, message: TrackMessage) => {
    const { ref, status } = message;
    if (status) stream.write({ ref, status });
    const done =
      message.final === true || (!!status && FINAL_STATUSES.includes(status));
    if (done) setTimeout(() => stream.end(), 500);
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

    const stream = trackingCallsMap.get(ref);

    if (!stream) {
      const now = Date.now();
      for (const [key, value] of early)
        if (now - value.at > KEEP_MS) early.delete(key);
      const kept = early.get(ref) ?? { at: now, messages: [] };
      kept.messages.push(message);
      early.set(ref, kept);
      return;
    }

    if (deliver(stream, message)) trackingCallsMap.delete(ref);
  };

  const trackCall = (call: { request: BaseApiObject }) => {
    const stream = call as unknown as CallStream;
    const { ref } = call.request;

    logger.verbose("call to trackCall", { ref });

    const kept = early.get(ref);
    early.delete(ref);
    for (const message of kept?.messages ?? [])
      if (deliver(stream, message)) return;

    trackingCallsMap.set(ref, stream);
  };

  return withErrorHandlingAndValidation(trackCall, V.baseApiObjectSchema);
}

export { createTrackCall, toTrackMessage };
