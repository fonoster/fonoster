#!/usr/bin/env node
/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import {
  INFLUXDB_BUCKET,
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
import runServices from "./runServices";
import { upsertDefaultPeer } from "./upsertDefaultPeer";

async function main() {
  if (OWNER_EMAIL) {
    const user = {
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    };
    await upsertDefaultUser(user);
  }

  // Upsert a Peer for the default region, if it doesn't already exist
  await upsertDefaultPeer();

  // Start the gRPC server
  runServices().catch(logger.error);

  const pubToInfluxDb = createInfluxDbPub({
    url: INFLUXDB_URL,
    token: INFLUXDB_TOKEN,
    org: INFLUXDB_ORG,
    bucket: INFLUXDB_BUCKET
  });

  // Subscribe to NATs events
  watchNats(NATS_URL, (event: Record<string, unknown>) => {
    logger.info("Received event", { event });
    const callRecord = event as { callId: string };
    pubToInfluxDb({
      name: "cdr",
      tag: callRecord.callId,
      data: event as Record<string, string>
    });
  });
}

const logger = getLogger({ service: "apiserver", filePath: __filename });

main().catch(logger.error);
