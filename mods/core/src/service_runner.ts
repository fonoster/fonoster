import logger from "@fonos/logger";
import grpc from "grpc";
import {getServerCredentials} from "./common/trust_util";
import {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService
} from "grpc-ts-health-check";
const ENDPOINT = process.env.BINDADDR || "0.0.0.0:50052";

interface ServiceInf {
    name: string,
    version: string,
    service: unknown, 
    server: unknown
}

export default function run(srvInf: ServiceInf) {
  const healthCheckStatusMap = {
    "": HealthCheckResponse.ServingStatus.SERVING
  };
  const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
  const server = new grpc.Server();

  server.addService(srvInf.service, srvInf.server);
  server.addService(HealthService, grpcHealthCheck)
  server.bind(ENDPOINT, getServerCredentials());
  server.start();

  logger.info(
    `Fonos ${srvInf.name} is online @ ${ENDPOINT} (API version = ${srvInf.version})`
  );
}

