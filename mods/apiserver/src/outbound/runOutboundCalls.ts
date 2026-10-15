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
import { getLogger } from "@fonoster/logger";
import { connect, NatsConnection, StringCodec } from "nats";
import {
  CALLS_CREATE_SUBJECT,
  CALLS_TRACK_CALL_SUBJECT,
  DEFAULT_NATS_QUEUE_GROUP
} from "../envs";
import { createNodeDirectory } from "./createNodeDirectory";
import {
  OutboundCallRequest,
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

/** media-control `call.progress` statuses → the Calls API's DialStatus names. */
const PROGRESS: Record<string, string> = {
  ringing: "PROGRESS",
  busy: "BUSY",
  no_answer: "NOANSWER",
  failed: "FAILED"
};

/** How long a room is watched at most (a room.ended normally stops it much sooner). */
const MAX_WATCH_MS = 4 * 60 * 60 * 1000;

/**
 * Status events of an API-originated call for TrackCall (the SDK's createCall statusStream), now
 * that Asterisk is gone: TRYING when placement starts, then the room's events from the media node
 * (`call.progress` → PROGRESS/BUSY/NOANSWER/FAILED, `call.answered` → ANSWER), and a final
 * message when the room ends so the stream closes.
 */
export function callTracker(nc: NatsConnection, ref: string) {
  const publish = (body: Record<string, unknown>) =>
    nc.publish(CALLS_TRACK_CALL_SUBJECT, sc.encode(JSON.stringify(body)));
  let stop: (() => void) | undefined;
  publish({ ref, status: "TRYING" });
  return {
    onRoom(nodeId: string, roomRef: string) {
      const sub = nc.subscribe(`media.${nodeId}.events.${roomRef}`, {
        callback: (err, msg) => {
          if (err) return;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(sc.decode(msg.data));
          } catch {
            return;
          }
          if (event.type === "call.progress") {
            const status = PROGRESS[String(event.status)] ?? "FAILED";
            publish({ ref, status });
            if (status !== "PROGRESS") stop?.();
          } else if (event.type === "call.answered") {
            publish({ ref, status: "ANSWER" });
          } else if (event.type === "room.ended") {
            publish({ ref, final: true });
            stop?.();
          }
        }
      });
      const timer = setTimeout(() => stop?.(), MAX_WATCH_MS);
      timer.unref?.();
      stop = () => {
        clearTimeout(timer);
        sub.unsubscribe();
        stop = undefined;
      };
    },
    failed() {
      publish({ ref, status: "FAILED" });
      stop?.();
    }
  };
}

/**
 * Serves `calls.create` (published by CreateCall) by placing each call on the media nodes. Takes
 * over from the Asterisk originate the apiserver used before the rebuild (cleanbreak CB-B2).
 * Returns a stop function.
 */
export async function runOutboundCalls(config: {
  natsUrl?: string;
  nc?: NatsConnection;
}): Promise<() => Promise<void>> {
  const nc =
    config.nc ??
    (await connect({ servers: config.natsUrl, maxReconnectAttempts: -1 }));
  const nodes = createNodeDirectory();
  const request = natsRequester(nc);

  const status = nc.subscribe("media.*.heartbeat", {
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
      const tracker = callTracker(nc, call.ref);
      placeOutboundCall(request, nodes, call, {
        onRoom: (nodeId, roomRef) => tracker.onRoom(nodeId, roomRef)
      }).then(
        (placed) =>
          logger.verbose("outbound call placed", { ref: call.ref, ...placed }),
        (e) => {
          tracker.failed();
          logger.error(`outbound call ${call.ref} not placed: ${e.message}`);
        }
      );
    }
  });
  await nc.flush();

  return async () => {
    status.unsubscribe();
    calls.unsubscribe();
    if (!config.nc) await nc.drain();
  };
}
