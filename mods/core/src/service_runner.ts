import logger from "@fonos/logger";
import grpc from "grpc";
import {getServerCredentials} from "./common/trust_util";
import interceptor from "@pionerlabs/grpc-interceptors";
import {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService
} from "grpc-ts-health-check";
const ENDPOINT = process.env.BINDADDR || "0.0.0.0:50051";
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
    `Starting API runner @ ${ENDPOINT} (API version = ${srvInfList[0].version})`
  );

  if (middlewareList) {
    middlewareList.forEach((middleware) => {
      logger.info(`Adding ${middleware.name} middleware`);
      server.use(middleware.middlewareObj);
    });
  }

  srvInfList.forEach((srvInf: ServiceInf) => {
    logger.info(`Adding ${srvInf.name} service`);
    server.addService(srvInf.service, srvInf.server);
  });

  server.bind(ENDPOINT, getServerCredentials());
  server.start();

  logger.info(`API Runner is online!`);
}
