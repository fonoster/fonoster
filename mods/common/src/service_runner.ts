/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import logger from "@fonoster/logger";
import assertEnvIsSet from "./env_is_set";
import * as grpc from "@grpc/grpc-js";
import { getServerCredentials } from "./trust_util";
import { useHealth } from "@fonoster/grpc-health-check";

const interceptor = require("@fonoster/grpc-interceptors");
const ENDPOINT = process.env.BINDADDR || "0.0.0.0:50052";

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

  logger.info(
    `@fonoster/common service runner [starting @ ${ENDPOINT}, api = ${srvInfList[0].version}]`
  );

  middlewareList?.forEach((middleware) => {
    server.use(middleware.middlewareObj);
    logger.info(
      `@fonoster/common service runner [added ${middleware.name} middleware]`
    );
  });

  srvInfList.forEach((srvInf: ServiceInf) => {
    assertEnvIsSet(srvInf.name);
    server.addService(srvInf.service, srvInf.server);
    logger.info(
      `@fonoster/common service runner [added ${srvInf.name} service]`
    );
  });

  server.bindAsync(ENDPOINT, getServerCredentials(), () => {
    server.start();
  });
  logger.info("@fonoster/common service runner [runner is online]");
}
