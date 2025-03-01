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
import { createCreateCallSubscriber as runCallManager } from "../calls/runCallManager";
import {
  APISERVER_BIND_ADDR,
  ASTERISK_ARI_PROXY_URL,
  ASTERISK_ARI_SECRET,
  ASTERISK_ARI_USERNAME,
  AUTHZ_SERVICE_ENABLED,
  AUTHZ_SERVICE_HOST,
  AUTHZ_SERVICE_METHODS,
  AUTHZ_SERVICE_PORT,
  HTTP_BRIDGE_PORT,
  IDENTITY_PUBLIC_KEY,
  NATS_URL
} from "../envs";
import { connectToAri } from "../voice/connectToAri";
import { allowList } from "./allowList";
import { httpBridge } from "./httpBridge";
import { identityConfig } from "./identityConfig";
import loadServices from "./loadServices";
import services from "./services";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const authorization = createAuthInterceptor(IDENTITY_PUBLIC_KEY, allowList);
const checkMethodAuthorized = createCheckMethodAuthorized(
  `${AUTHZ_SERVICE_HOST}:${AUTHZ_SERVICE_PORT}`,
  AUTHZ_SERVICE_METHODS
);

async function runServices() {
  const healthImpl = new HealthImplementation(statusMap);
  const credentials = await getServerCredentials({});
  const interceptors = AUTHZ_SERVICE_ENABLED
    ? [authorization, checkMethodAuthorized]
    : [authorization];

  const server = new grpc.Server({ interceptors });

  // Add the health check service to the server
  healthImpl.addToServer(server);

  // Load the remaining services
  loadServices(server, await services);

  // Connecting to Asterisk ARI
  await connectToAri(httpBridge(identityConfig, { port: HTTP_BRIDGE_PORT }));

  // Additional Call Managers subscriber may be added here to handle call events
  await runCallManager({
    natsUrl: NATS_URL,
    ariProxyUrl: ASTERISK_ARI_PROXY_URL,
    ariUsername: ASTERISK_ARI_USERNAME,
    ariPassword: ASTERISK_ARI_SECRET
  });

  server.bindAsync(APISERVER_BIND_ADDR, credentials, async () => {
    healthImpl.setStatus("", GRPC_SERVING_STATUS);
    logger.info(`apiserver running at ${APISERVER_BIND_ADDR}`);
  });
}

export default runServices;
