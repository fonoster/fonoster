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
import {
  createAuthInterceptor,
  createServiceDefinition,
  getServerCredentials,
  GRPC_SERVING_STATUS,
  statusMap
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { HealthImplementation } from "grpc-health-check";
import { buildIdentityService, identityAllowList, upsertDefaultUser } from "..";
import { loadConfig } from "./config";
import { startHttpBridge } from "./httpBridge";

const logger = getLogger({ service: "identity", filePath: __filename });

/**
 * Standalone Identity gRPC service. Wraps `buildIdentityService` with the auth
 * interceptor, the identity allow-list, a health service, and the accept-invite
 * HTTP bridge — without any telephony subsystem. Configured entirely from a
 * file (see `./config`); no environment variables.
 */
async function main() {
  const { bindAddr, httpBridgePort, appUrl, defaultUser, identityConfig } = loadConfig();

  const { definition, handlers } = buildIdentityService(identityConfig);

  const authorization = createAuthInterceptor(identityConfig.publicKey, identityAllowList);
  const credentials = await getServerCredentials({});
  const healthImpl = new HealthImplementation(statusMap);

  const server = new grpc.Server({ interceptors: [authorization] });
  healthImpl.addToServer(server);
  server.addService(
    createServiceDefinition(definition),
    handlers as unknown as grpc.UntypedServiceImplementation
  );

  if (defaultUser) {
    await upsertDefaultUser(identityConfig, defaultUser);
  }

  startHttpBridge(identityConfig, { port: httpBridgePort, appUrl });

  server.bindAsync(bindAddr, credentials, (error) => {
    if (error) {
      logger.error("failed to start Identity service", error);
      process.exit(1);
    }
    healthImpl.setStatus("", GRPC_SERVING_STATUS);
    logger.info(`Identity service running at ${bindAddr}`);
  });
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
