import {
  INFLUXDB_CALLS_BUCKET,
  logUnhandledRejections,
  setRootDomain
} from "@fonoster/common";
import { migratePasswordStorage, upsertDefaultUser } from "@fonoster/identity";
import { configureLogger, getLogger } from "@fonoster/logger";
import { getConfig } from "./config";
import { applyCatalog } from "./core/applyCatalog";
import { prisma } from "./core/db";
import { identityConfig } from "./core/identityConfig";
import runServices from "./core/runServices";
import { upsertMediaNodePeer } from "./core/upsertMediaNodePeer";
import {
  INFLUXDB_ORG,
  INFLUXDB_TOKEN,
  INFLUXDB_URL,
  NATS_CONNECTION,
  OWNER_EMAIL,
  OWNER_NAME,
  OWNER_PASSWORD
} from "./envs";
import { createInfluxDbPub } from "./events/createInfluxDbPub";
import { watchNats } from "./events/nats";

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

  // The provider catalog (add-self-host-installer D7): applied on every start, idempotent. A
  // configured file that can't be read or applied stops the server (IC-B2).
  if (config.catalog) {
    try {
      const lines = await applyCatalog(config.catalog.file, prisma);
      logger.info(
        lines[0] === "no changes"
          ? "catalog: no changes"
          : `catalog: ${lines.length} entries added or changed`,
        { file: config.catalog.file }
      );
    } catch (e) {
      logger.error(`catalog: ${(e as Error).message}`);
      process.exit(1);
    }
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

  // Routr's call events become CDR points (one replica per event, refs shared: ST-1)
  watchNats(NATS_CONNECTION, pubToInfluxDb);
}

const logger = getLogger({ service: "apiserver", filePath: __filename });
logUnhandledRejections(logger);

main().catch(logger.error);
