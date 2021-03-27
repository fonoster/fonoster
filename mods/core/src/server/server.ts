import path from "path";

if (!process.env.NODE_ENV || process.env.NODE_ENV === "dev") {
  const env = path.join(__dirname, "..", "..", "..", "..", ".env");
  require("dotenv").config({ path: env });
}

import { getSalt } from "@fonos/certs";
import AuthMiddleware from "../common/auth/auth_middleware";
import interceptor from "@pionerlabs/grpc-interceptors";
import logger from "@fonos/logger";
import grpc from "grpc";
import StorageServer, {
  IStorageServer,
  StorageService
} from "./storage/storage";
import UserManagerServer, {
  UserManagerService
} from "./usermanager/usermanager";
import { IUserManagerServer } from "./protos/usermanager_grpc_pb";
import AppManagerServer, { AppManagerService } from "./appmanager/appmanager";
import { IAppManagerServer } from "./protos/appmanager_grpc_pb";
import { INumbersServer } from "./protos/numbers_grpc_pb";
import { IAgentsServer, AgentsService } from "./protos/agents_grpc_pb";
import { IDomainsServer, DomainsService } from "./protos/domains_grpc_pb";
import { IProvidersServer, ProvidersService } from "./protos/providers_grpc_pb";
import NumbersServer, { NumbersService } from "./numbers/numbers";
import AgentsServer from "./agents/agents";
import DomainsServer from "./domains/domains";
import ProvidersServer from "./providers/providers";
import { getServerCredentials } from "../common/trust_util";
import {
  GrpcHealthCheck,
  HealthCheckResponse,
  HealthService
} from "grpc-ts-health-check";
import CallManagerServer, {
  ICallManagerServer
} from "./callmanager/callmanager";
import { CallManagerService } from "./protos/callmanager_grpc_pb";
import { mongoConnection } from "../common/mongo";

const healthCheckStatusMap = {
  "": HealthCheckResponse.ServingStatus.SERVING
};
const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);

async function main() {
  mongoConnection();
  /*if (!accessExist()) {
    logger.log('info', `No access file found. Creating access file`)
    await createAccessFile()
  }*/
  const server = interceptor.serverProxy(new grpc.Server());
  const endpoint = process.env.BINDADDR || "0.0.0.0:50052";
  server.addService<IProvidersServer>(ProvidersService, new ProvidersServer());
  server.addService<IDomainsServer>(DomainsService, new DomainsServer());
  server.addService<IAgentsServer>(AgentsService, new AgentsServer());
  server.addService<INumbersServer>(NumbersService, new NumbersServer());
  server.addService<IStorageServer>(StorageService, new StorageServer());
  // WARNINIG: We need to temporarily disable the healthcheck until we fix the
  // conflict with the authentication interceptor
  // server.addService(HealthService, grpcHealthCheck)
  server.addService<IAppManagerServer>(
    AppManagerService,
    new AppManagerServer()
  );

  server.addService<ICallManagerServer>(
    CallManagerService,
    new CallManagerServer()
  );

  server.addService<IUserManagerServer>(
    UserManagerService,
    new UserManagerServer()
  );

  const authMiddleware = new AuthMiddleware(getSalt());

  server.bind(endpoint, getServerCredentials());
  server.use(authMiddleware.middleware);
  server.start();

  logger.info(
    `Fonos APIServer is online @ ${endpoint} (API version = v1alpha1)`
  );
}

main();
