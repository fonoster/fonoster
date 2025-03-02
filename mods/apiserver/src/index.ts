import {
  CALL_DETAIL_RECORD_MEASUREMENT,
  INFLUXDB_CALLS_BUCKET
} from "@fonoster/common";
import { upsertDefaultUser } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { identityConfig } from "./core/identityConfig";
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
