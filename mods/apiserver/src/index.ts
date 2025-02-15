#!/usr/bin/env node
/*
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
import { upsertDefaultUser } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import runServices from "./core/runServices";
import { upsertDefaultPeer } from "./core/upsertDefaultPeer";
import {
  INFLUXDB_ORG,
  INFLUXDB_TOKEN,
  INFLUXDB_URL,
  NATS_URL,
  OWNER_EMAIL,
  OWNER_NAME,
  OWNER_PASSWORD
} from "./envs";
import { createInfluxDbPub } from "./events/createInfluxDbPub";
import { watchNats } from "./events/nats";
import { transformEvent } from "./events/transformEvent";
import {
  CALL_DETAIL_RECORD_MEASUREMENT,
  INFLUXDB_CALLS_BUCKET
} from "@fonoster/common";
import { identityConfig } from "./core/identityConfig";

import("./core/removeSwaggerNotice");

async function main() {
  if (OWNER_EMAIL) {
    const user = {
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    };
    await upsertDefaultUser(identityConfig, user);
  }

  // Upsert a Peer for the default region, if it doesn't already exist
  await upsertDefaultPeer();

  // Start the gRPC server
  runServices().catch(logger.error);

  const pubToInfluxDb = createInfluxDbPub({
    url: INFLUXDB_URL,
    token: INFLUXDB_TOKEN,
    org: INFLUXDB_ORG,
    bucket: INFLUXDB_CALLS_BUCKET
  });

  // Subscribe to NATs events
  watchNats(NATS_URL, (event: Record<string, unknown>) => {
    logger.verbose("received nats event", { ...event });

    pubToInfluxDb({
      name: CALL_DETAIL_RECORD_MEASUREMENT,
      tag: event.callId,
      data: transformEvent(event)
    });
  });
}

const logger = getLogger({ service: "apiserver", filePath: __filename });

main().catch(logger.error);
