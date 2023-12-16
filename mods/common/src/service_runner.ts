/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import * as grpc from "@grpc/grpc-js";
import { getServerCredentials } from "./trust_util";
import { useHealth } from "@fonoster/grpc-health-check";
import { getLogger } from "@fonoster/logger";
import assertEnvIsSet from "./env_is_set";

const interceptor = require("grpc-interceptors");
const BIND_ADDR = "0.0.0.0:50052";

const logger = getLogger({ service: "common", filePath: __filename });

interface ServiceInf {
  name: string;
  version: string;
  service: any;
  server: any;
}

interface Middleware {
  name: string;
  description?: string;
  middlewareObj;
}

export default function run(
  srvInfList: ServiceInf[],
  middlewareList?: Middleware[]
) {
  const grpcServer = new grpc.Server();
  // Wrapped server
  const server = interceptor.serverProxy(useHealth(grpcServer));

  logger.info(`service runner`, {
    bindAddr: BIND_ADDR,
    apiVersion: srvInfList[0].version
  });

  middlewareList?.forEach((middleware) => {
    server.use(middleware.middlewareObj);
    logger.info(`service runner`, {
      middleware: middleware.name
    });
  });

  srvInfList.forEach((srvInf: ServiceInf) => {
    // TODO: Perhaps this method should be simplified now that we are using less services
    assertEnvIsSet("apiserver");
    server.addService(srvInf.service, srvInf.server);
    logger.info(`service runner`, {
      service: srvInf.name
    });
  });

  server.bindAsync(BIND_ADDR, getServerCredentials(), () => {
    server.start();
  });

  logger.info("service runner online");
}
