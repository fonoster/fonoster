import { logUnhandledRejections, setRootDomain } from "@fonoster/common";
import { migratePasswordStorage } from "@fonoster/identity";
import { configureLogger, getLogger } from "@fonoster/logger";
import { getConfig } from "./config";
import { applyCatalog } from "./core/applyCatalog";
import { prisma } from "./core/db";
import { identityConfig } from "./core/identityConfig";
import runServices from "./core/runServices";
import { upsertRoomrPeer } from "./core/upsertRoomrPeer";

// Apply fonoster.yaml to the shared modules before serving. Loggers created
// while the imports above ran switch to the file's settings here.
const config = getConfig();
configureLogger(config.logs);
setRootDomain(config.domain);

import("./core/removeSwaggerNotice");

async function main() {
  await migratePasswordStorage(identityConfig);

  // The first user is created with fonoster-owner (bin/owner.ts), not from the config file.
  if (config.identity.owner)
    logger.warn(
      "identity.owner in fonoster.yaml is ignored: create the first user with fonoster-owner create <email>"
    );

  // The provider catalog (add-self-host-installer D7): applied on every start, idempotent. A
  // configured file that can't be read or applied stops the server (IC-B2).
  if (config.catalog) {
    // `file`, then each of `files` (a stack's own catalogs, e.g. the fakes in dev and tests).
    const files = [
      { file: config.catalog.file, key: "catalog.file" },
      ...(config.catalog.files ?? []).map((file, i) => ({
        file,
        key: `catalog.files[${i}]`
      }))
    ];
    for (const { file, key } of files) {
      try {
        const lines = await applyCatalog(file, prisma, key);
        logger.info(
          lines[0] === "no changes"
            ? "catalog: no changes"
            : `catalog: ${lines.length} entries added or changed`,
          { file }
        );
      } catch (e) {
        logger.error(`catalog: ${(e as Error).message}`);
        process.exit(1);
      }
    }
  }

  // The roomr peer every app-linked number points at (add-roomr 4.1). Runs in the
  // background: it waits for Routr, which may start after the API server.
  upsertRoomrPeer().catch(logger.error);

  // Start the gRPC server
  runServices().catch(logger.error);
}

const logger = getLogger({ service: "apiserver", filePath: __filename });
logUnhandledRejections(logger);

main().catch(logger.error);
