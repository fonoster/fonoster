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
import { natsConnectOptions, NatsTarget } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Point } from "@influxdata/influxdb-client";
import { connect, NatsConnection } from "nats";
import { CallRefStore, openCallRefs } from "./callRefs";
import { createCallEventHandler } from "./createCdrWriter";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const ROUTR_CALL_SUBJECT = "routr.call.*";

/**
 * One replica of the queue group handles each Routr call event (control-plane "Events processed
 * once"): without it every replica wrote its own CDR points for every call (ST-1).
 */
export const CALL_EVENTS_QUEUE = "apiserver-cdr";

/**
 * Subscribes to Routr's call events and writes one CDR point per event. Returns the unsubscribe
 * function once the subscription is registered on the server.
 */
async function subscribeCallEvents(
  nc: NatsConnection,
  write: (point: Point) => void,
  options: { refs?: CallRefStore; queue?: string } = {}
) {
  const refs = options.refs ?? (await openCallRefs(nc, logger));
  const handle = createCallEventHandler({ refs, write });
  const sub = nc.subscribe(ROUTR_CALL_SUBJECT, {
    queue: options.queue ?? CALL_EVENTS_QUEUE,
    callback: (err, m) => {
      if (err) return;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(m.data.toString());
      } catch {
        return;
      }
      logger.verbose("received nats event", { ...event });
      handle(event).catch((e) =>
        logger.warn(`could not write the CDR point: ${(e as Error).message}`)
      );
    }
  });
  await nc.flush();
  logger.verbose("subscribed to subjects", {
    subjects: [ROUTR_CALL_SUBJECT],
    queue: options.queue ?? CALL_EVENTS_QUEUE
  });
  return () => sub.unsubscribe();
}

/**
 * This method listens for call events from Routr and writes them as CDR points.
 *
 * @param {string} natsUrl - The NATS server URL
 * @param {Function} write - Writes one point (InfluxDB)
 * @return {void}
 */
function watchNats(nats: NatsTarget, write: (point: Point) => void) {
  (async () => {
    const nc = await connect({
      ...natsConnectOptions(nats),
      maxReconnectAttempts: -1
    });

    logger.verbose("connected to nats", {
      natsUrl: natsConnectOptions(nats).servers
    });

    await subscribeCallEvents(nc, write);
  })().catch((e) => logger.error(`call events: ${(e as Error).message}`));
}

export { subscribeCallEvents, watchNats };
