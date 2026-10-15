import {
  CALL_DETAIL_RECORD_MEASUREMENT,
  INFLUXDB_CALLS_BUCKET,
  setRootDomain
} from "@fonoster/common";
import { migratePasswordStorage, upsertDefaultUser } from "@fonoster/identity";
import { configureLogger, getLogger } from "@fonoster/logger";
import { getConfig } from "./config";
import { identityConfig } from "./core/identityConfig";
import runServices from "./core/runServices";
import { upsertMediaNodePeer } from "./core/upsertMediaNodePeer";
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

// Apply fonoster.yaml to the shared modules before serving. Loggers created
// while the imports above ran switch to the file's settings here.
const config = getConfig();
configureLogger(config.logs);
setRootDomain(config.domain);

import("./core/removeSwaggerNotice");

async function main() {
  await migratePasswordStorage(identityConfig);

  if (OWNER_EMAIL) {
    const user = {
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    };
    await upsertDefaultUser(identityConfig, user);
  }

  // The media-node peer every app-linked number points at (add-media-node 4.1). Runs in the
  // background: it waits for Routr, which may start after the API server.
  upsertMediaNodePeer().catch(logger.error);

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
