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
import { ObjectStoreConfig } from "@fonoster/callrecord";
import { getLogger } from "@fonoster/logger";
import { Router } from "express";
import { connect } from "nats";
import { subscribeRecordIndex } from "./createIndexRecord";
import { createRecordsRouter } from "./createRecordsRouter";
import { natsMaintenanceClient, runRetention } from "./maintenance";
import { createStoreResolver } from "./stores";
import { RecordsDb } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

export type CallRecordsConfig = {
  enabled: boolean;
  stores: ObjectStoreConfig[];
  retentionIntervalMinutes: number;
  maintenanceTimeoutMs: number;
};

/**
 * Starts the control plane's side of call records: the index consumer, the retention job and the
 * records API router (mounted on the HTTP bridge at /api/records).
 */
export async function runCallRecords(
  config: CallRecordsConfig,
  deps: { natsUrl: string; identityPublicKey: string; db: RecordsDb }
): Promise<{ routers: { path: string; router: Router }[] }> {
  if (!config.enabled) return { routers: [] };
  const nc = await connect({
    servers: deps.natsUrl,
    maxReconnectAttempts: -1
  });
  subscribeRecordIndex(nc, deps.db);
  const maintenance = natsMaintenanceClient(nc, config.maintenanceTimeoutMs);
  const retention = setInterval(
    () =>
      void runRetention(deps.db, maintenance)
        .then(
          (done) =>
            done.length &&
            logger.info(`retention deleted ${done.length} record parts`)
        )
        .catch((e) => logger.error(`retention failed: ${e.message}`)),
    config.retentionIntervalMinutes * 60_000
  );
  retention.unref();
  const router = createRecordsRouter({
    db: deps.db,
    identityPublicKey: deps.identityPublicKey,
    stores: createStoreResolver(config.stores),
    maintenance
  });
  logger.info("call records: index, retention and /api/records are on");
  return { routers: [{ path: "/api/records", router }] };
}
