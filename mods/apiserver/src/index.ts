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
import { CALL_DETAIL_RECORD_MEASUREMENT, CallType } from "./calls/types";
import runServices from "./core/runServices";
import { upsertDefaultPeer } from "./core/upsertDefaultPeer";
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

import("./core/removeSwaggerNotice");

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
    logger.verbose("received nats event", { ...event });

    if (event.startTime) {
      event.startedAt = new Date(event.startTime as string).getTime() / 1000;
      event.endedAt = new Date(event.startTime as string).getTime() / 1000;
      delete event.startTime;
    }

    if (event.endTime) {
      event.endedAt = new Date(event.endTime as string).getTime() / 1000;
      delete event.endTime;
    }

    if (event.extraHeaders["X-Access-Key-Id"]) {
      event.accessKeyId = event.extraHeaders["X-Access-Key-Id"];
    }

    if (event.extraHeaders["X-Call-Ref"]) {
      event.ref = event.extraHeaders["X-Call-Ref"];
    }

    if (event.extraHeaders["X-DOD-Number"]) {
      event.from = event.extraHeaders["X-DOD-Number"];
    }

    if (event.extraHeaders["X-Is-Programmable-Type"]) {
      event.type = CallType.PROGRAMMABLE;
    }

    if (event.hangupCause) {
      event.status = event.hangupCause;
      delete event.hangupCause;
    }

    const tag = event.callId as string;

    // Delete the extra headers as they may contain sensitive information
    delete event.extraHeaders;
    delete event.callId;

    pubToInfluxDb({
      name: CALL_DETAIL_RECORD_MEASUREMENT,
      tag,
      data: event as Record<string, string>
    });
  });
}

const logger = getLogger({ service: "apiserver", filePath: __filename });

main().catch(logger.error);
