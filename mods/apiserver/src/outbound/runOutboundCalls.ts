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
import { CALLS_CREATE_SUBJECT, DEFAULT_NATS_QUEUE_GROUP } from "../envs";
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
      placeOutboundCall(request, nodes, call).then(
        (placed) =>
          logger.verbose("outbound call placed", { ref: call.ref, ...placed }),
        (e) =>
          logger.error(`outbound call ${call.ref} not placed: ${e.message}`)
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
