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
import { createCheckMethodAuthorized } from "@fonoster/authz";
import {
  createAuthInterceptor,
  getServerCredentials,
  GRPC_SERVING_STATUS,
  statusMap
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { HealthImplementation } from "grpc-health-check";
import { connect } from "nats";
import { getConfig } from "../config";
import {
  APISERVER_BIND_ADDR,
  APP_URL,
  AUTHZ_SERVICE_ENABLED,
  AUTHZ_SERVICE_HOST,
  AUTHZ_SERVICE_METHODS,
  AUTHZ_SERVICE_PORT,
  CALL_RECORDS,
  DOMAIN,
  HTTP_BRIDGE_PORT,
  IDENTITY_AUDIENCE,
  IDENTITY_ISSUER,
  IDENTITY_PUBLIC_KEY,
  NATS,
  NATS_CONNECTION,
  REGIONS,
  SESSION_APPS,
  SIP_ROOT,
  WEBHOOKS
} from "../envs";
import { runOutboundCalls } from "../outbound";
import { subscribeRegistryUsage } from "../providers";
import { CallRecordsConfig, RecordsDb, runCallRecords } from "../records";
import {
  createSnapshotSources,
  RegionsConfig,
  runRegions,
  withConfigChangeHook
} from "../regions";
import {
  createSessionRouter,
  identityFromHandlers,
  SESSION_PATH
} from "../session";
import { runUsageConsumer } from "../usage/runUsageConsumer";
import { runStorageSnapshots } from "../usage/snapshotStorage";
import { UsageDb } from "../usage/types";
import {
  runWebhookFanout,
  WebhookFanoutConfig
} from "../webhooks/runWebhookFanout";
import { allowList } from "./allowList";
import { prisma } from "./db";
import { httpBridge } from "./httpBridge";
import { identityConfig } from "./identityConfig";
import loadServices from "./loadServices";
import { workspaceRegionHooks } from "./regionHooks";
import services from "./services";
import { apiserverTelemetry } from "./telemetry";
import { createTelemetryInterceptor } from "./telemetryInterceptor";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const authorization = createAuthInterceptor(IDENTITY_PUBLIC_KEY, allowList, {
  issuer: IDENTITY_ISSUER,
  audience: IDENTITY_AUDIENCE
});
const checkMethodAuthorized = createCheckMethodAuthorized(
  `${AUTHZ_SERVICE_HOST}:${AUTHZ_SERVICE_PORT}`,
  AUTHZ_SERVICE_METHODS
);

async function runServices() {
  const healthImpl = new HealthImplementation(statusMap);
  const credentials = await getServerCredentials({});
  // Telemetry first, so refused requests are measured too.
  const telemetry = createTelemetryInterceptor(apiserverTelemetry());
  const interceptors = AUTHZ_SERVICE_ENABLED
    ? [telemetry, authorization, checkMethodAuthorized]
    : [telemetry, authorization];

  const server = new grpc.Server({ interceptors });

  // Add the health check service to the server
  healthImpl.addToServer(server);

  const loaded = await services;

  // Private regions (add-private-regions): hub link, config sync, relay and /api/regions
  const handlers = Object.assign(
    {},
    ...loaded.map((s) => s.handlers)
  ) as Record<string, never>;
  const regions = await runRegions(REGIONS as RegionsConfig, {
    db: prisma,
    identityPublicKey: IDENTITY_PUBLIC_KEY,
    identityTokenOptions: {
      issuer: IDENTITY_ISSUER,
      audience: IDENTITY_AUDIENCE
    },
    issuer: REGIONS.controlPlaneUrl ?? APP_URL,
    defaultControlPlaneUrl: APP_URL,
    defaultLeafUrl: `tls://${DOMAIN}:7422`,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    currentVersion: require("../../package.json").version,
    sources: createSnapshotSources({
      db: prisma,
      handlers,
      callFeatures: getConfig().features.calls
    }),
    // Workspace domains are <label>.sip.<domain>; a region rewrites them to its own.
    rootDomain: () => SIP_ROOT
  });
  workspaceRegionHooks.attach(regions);

  // Load the remaining services; writes to synced resources notify the config sync
  loadServices(server, withConfigChangeHook(loaded, regions.onConfigChange));

  // Call records (add-call-record): index consumer, retention and the /api/records routes
  const records = await runCallRecords(CALL_RECORDS as CallRecordsConfig, {
    natsUrl: NATS_CONNECTION,
    identityPublicKey: IDENTITY_PUBLIC_KEY,
    identityTokenOptions: {
      issuer: IDENTITY_ISSUER,
      audience: IDENTITY_AUDIENCE
    },
    db: prisma as unknown as RecordsDb,
    relay: { regionOf: regions.regionOf, client: regions.relay },
    onConfigChange: regions.onConfigChange,
    usage: { directory: () => workspaceRegionHooks.directory() }
  });

  // The dashboard's cookie session (M4): refresh token in an httpOnly cookie on its origin
  const session = {
    path: SESSION_PATH,
    router: createSessionRouter({
      identity: identityFromHandlers(handlers),
      secureCookie: APP_URL.startsWith("https:")
    })
  };

  httpBridge(identityConfig, {
    port: HTTP_BRIDGE_PORT,
    routers: [...records.routers, ...regions.routers, session]
  });

  // Bus consumers: webhook fan-out (LO-B1) and the AppBridge replicas' catalog use (LO-B11)
  const bus = await connect({ ...NATS, maxReconnectAttempts: -1 });
  subscribeRegistryUsage(bus, prisma);
  await runUsageConsumer({
    nc: bus,
    db: prisma as unknown as UsageDb,
    directory: () => workspaceRegionHooks.directory()
  });
  runStorageSnapshots({
    db: prisma as unknown as UsageDb,
    directory: () => workspaceRegionHooks.directory()
  });
  if (WEBHOOKS.fanout) {
    await runWebhookFanout(
      {
        ...(WEBHOOKS as WebhookFanoutConfig),
        enabled: true,
        allowInsecureUrls: SESSION_APPS.allowInsecureWebhooks
      },
      { nc: bus, db: prisma }
    );
  }

  // CreateCall: places API-originated calls on the Roomr nodes (cleanbreak CB-B2)
  await runOutboundCalls({ natsUrl: NATS_CONNECTION });

  server.bindAsync(APISERVER_BIND_ADDR, credentials, async () => {
    healthImpl.setStatus("", GRPC_SERVING_STATUS);
    logger.info(`apiserver running at ${APISERVER_BIND_ADDR}`);
  });
}

export default runServices;
