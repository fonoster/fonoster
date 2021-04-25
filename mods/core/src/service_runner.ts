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

export default function run(srvInfList: ServiceInf[]) {
  const healthCheckStatusMap = {
    "": HealthCheckResponse.ServingStatus.SERVING
  };
  const server = new grpc.Server();

  // Adding health endpoint
  const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
  server.addService(HealthService, grpcHealthCheck)

  logger.info(
    `Starting API runner @ ${ENDPOINT} (API version = ${srvInfList[0].version})`
  );

  srvInfList.forEach((srvInf: ServiceInf) => {
    logger.info(`Adding service ${srvInf.name} `)
    server.addService(srvInf.service, srvInf.server);
  })
  
  server.bind(ENDPOINT, getServerCredentials());
  server.start();

  logger.info(
    `API Runner is online!`
  );

}

