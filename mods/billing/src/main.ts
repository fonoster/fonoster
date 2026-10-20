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
/**
 * fonoster-billing (add-billing-service): rates stored usage, keeps the credit ledger and answers
 * session admission (Authz) for Fonoster Cloud. Reads `billing.yaml` or `--config <path>`.
 */
import { AuthzServer } from "@fonoster/authz";
import {
  createWorkspaceDirectory,
  createPrismaClient as identityClient
} from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { connect } from "nats";
import { RegistryActiveCalls } from "./activeCalls";
import { BillingAuthzHandler } from "./admission";
import { systemClock } from "./clock";
import { loadBillingConfig } from "./config";
import { createPrismaClient } from "./db";
import { cachedDirectory, OwnerDirectory } from "./directory";
import { expireDue } from "./ledger";
import { loadRateCards } from "./rateCards";
import { runUsageConsumer } from "./runUsageConsumer";

const logger = getLogger({ service: "billing", filePath: __filename });

/** How often expired grants are swept. */
const EXPIRY_SWEEP_MS = 60_000;

async function main() {
  const config = loadBillingConfig();
  if (config.clock.kind !== "system")
    throw new Error("only clock.kind system is supported by the service yet");
  const clock = systemClock;
  const prisma = createPrismaClient(config.database.url);
  const cards = loadRateCards(config.rateCards.dir);
  logger.info(
    `rate cards: ${cards.map((c) => c.version).join(", ") || "none"}`
  );

  let directory: OwnerDirectory = { ownerOf: async () => undefined };
  if (config.identity) {
    const workspaces = createWorkspaceDirectory(
      identityClient(config.identity.databaseUrl, config.identity.encryptionKey)
    );
    directory = cachedDirectory({
      ownerOf: async (ws) => (await workspaces.workspace(ws))?.ownerRef
    });
  } else logger.warn("no identity database: every call is admitted");

  const nc = await connect({
    servers: config.nats.url,
    maxReconnectAttempts: -1
  });
  await runUsageConsumer({ nc, prisma, cards, clock });
  const activeCalls = await new RegistryActiveCalls(directory).watch(nc);

  await new AuthzServer({
    bind: config.grpc.bind,
    port: config.grpc.port
  }).listen(
    new BillingAuthzHandler({
      prisma,
      directory,
      activeCalls,
      plans: config.plans,
      clock
    })
  );

  setInterval(
    () =>
      expireDue(prisma, clock.now()).catch((e: Error) =>
        logger.warn(`expiry sweep failed: ${e.message}`)
      ),
    EXPIRY_SWEEP_MS
  );
}

main().catch((e) => {
  logger.error(e.message);
  process.exit(1);
});
