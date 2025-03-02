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
import { connect } from "nats";
import { NatsEventCallback } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const ROUTR_CALL_SUBJECT = "routr.call.*";

async function streamEvents(subscription, callback: NatsEventCallback) {
  // eslint-disable-next-line no-loops/no-loops
  for await (const m of subscription) {
    const messageStr = m.data.toString();
    callback({ ...JSON.parse(messageStr) });
  }
}

/**
 * This method listens for registration events from Routr.
 *
 * @param {string} natsUrl - The NATS server URL
 * @param {RegisterEventCallback} callback - The callback function
 * @return {void}
 */
function watchNats(natsUrl: string, callback: NatsEventCallback) {
  (async () => {
    const nc = await connect({ servers: natsUrl, maxReconnectAttempts: -1 });

    const a = nc.subscribe(ROUTR_CALL_SUBJECT);

    logger.verbose("connected to nats", { natsUrl });
    logger.verbose("subscribed to subjects", {
      subjects: [ROUTR_CALL_SUBJECT]
    });

    await Promise.all([streamEvents(a, callback)]);
  })();
}

export { watchNats };
