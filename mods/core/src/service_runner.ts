import logger from "@fonos/logger";
import grpc from "grpc";
import {getServerCredentials} from "./common/trust_util";
import interceptor from "@pionerlabs/grpc-interceptors";
import {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService
} from "grpc-ts-health-check";
const ENDPOINT = process.env.BINDADDR || "0.0.0.0:50052";
import {mongoConnection} from "@fonos/auth";

interface ServiceInf {
  name: string;
  version: string;
  service: unknown;
  server: unknown;
}

interface Middleware {
  name: string;
  description?: string;
  middlewareObj: any;
}

export default function run(
  srvInfList: ServiceInf[],
  middlewareList?: Middleware[]
) {
  mongoConnection();

  const healthCheckStatusMap = {
    "": HealthCheckResponse.ServingStatus.SERVING
  };
  const server = interceptor.serverProxy(new grpc.Server());

  // Adding health endpoint
  const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
  server.addService(HealthService, grpcHealthCheck);

  logger.info(
    `@fonos/core service runner [starting @ ${ENDPOINT}, api = ${srvInfList[0].version}]`
  );

  if (middlewareList) {
    middlewareList.forEach((middleware) => {
      server.use(middleware.middlewareObj);
      logger.info(
        `@fonos/core service runner [added ${middleware.name} middleware]`
      );
    });
  }

  srvInfList.forEach((srvInf: ServiceInf) => {
    server.addService(srvInf.service, srvInf.server);
    logger.info(`@fonos/core service runner [added ${srvInf.name} service]`);
  });

  server.bind(ENDPOINT, getServerCredentials());
  server.start();

  logger.info(`@fonos/core service runner [runner is online]`);
}
