/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import logger from "@fonos/logger";
import grpc from "grpc";
import {getServerCredentials} from "./trust_util";
import interceptor from "@pionerlabs/grpc-interceptors";
import {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService
} from "grpc-ts-health-check";
const ENDPOINT = process.env.BINDADDR || "0.0.0.0:50052";

interface ServiceInf {
  name: string;
  version: string;
  service: unknown;
  server: unknown;
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
  const healthCheckStatusMap = {
    "": HealthCheckResponse.ServingStatus.SERVING
  };

  const grpcServer = new grpc.Server();

  // Adding health endpoint
  const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
  grpcServer.addService(HealthService, grpcHealthCheck);

  // Wrapped server
  const server = interceptor.serverProxy(grpcServer);

  logger.info(
    `@fonos/common service runner [starting @ ${ENDPOINT}, api = ${srvInfList[0].version}]`
  );

  if (middlewareList) {
    middlewareList.forEach((middleware) => {
      server.use(middleware.middlewareObj);
      logger.info(
        `@fonos/common service runner [added ${middleware.name} middleware]`
      );
    });
  }

  srvInfList.forEach((srvInf: ServiceInf) => {
    server.addService(srvInf.service, srvInf.server);
    logger.info(`@fonos/common service runner [added ${srvInf.name} service]`);
  });

  server.bind(ENDPOINT, getServerCredentials());
  server.start();

  logger.info("@fonos/common service runner [runner is online]");
}
