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
import { createAuthInterceptor } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { HealthImplementation } from "grpc-health-check";
import {
  APISERVER_BIND_ADDR,
  GRPC_NOT_SERVING_STATUS,
  GRPC_SERVING_STATUS,
  IDENTITY_PUBLIC_KEY
} from "./envs";
import loadServices from "./loadServices";
import services from "./services";
import getServerCredentials from "./utils/getServerCredentials";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const authorization = createAuthInterceptor(IDENTITY_PUBLIC_KEY, [
  "/fonos.health.v1.Health/Check",
  // TODO: This should be rate limited to avoid account spamming
  "/fonoster.identity.v1beta2.Identity/CreateUser",
  "/fonoster.identity.v1beta2.Identity/CreateWorkspace",
  "/fonoster.identity.v1beta2.Identity/ExchangeApiKey",
  "/fonoster.identity.v1beta2.Identity/ExchangeCredentials",
  "/fonoster.identity.v1beta2.Identity/ExchangeRefreshToken"
]);

async function runServices() {
  const statusMap = {
    // By convention, the empty string represents the entire server
    "": GRPC_NOT_SERVING_STATUS
  };
  const healthImpl = new HealthImplementation(statusMap);
  const credentials = await getServerCredentials({});
  const server = new grpc.Server({
    interceptors: [authorization]
  });

  // Add the health check service to the server
  healthImpl.addToServer(server);

  // Load the remaining services
  loadServices(server, await services);

  server.bindAsync(APISERVER_BIND_ADDR, credentials, () => {
    healthImpl.setStatus("", GRPC_SERVING_STATUS);
    logger.info(`apiserver running at ${APISERVER_BIND_ADDR}`);
  });
}

export default runServices;
