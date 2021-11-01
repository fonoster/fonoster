#!/usr/bin/env node
import {AuthMiddleware} from "@fonoster/auth";
import {runServices} from "@fonoster/common";
import {getSalt} from "@fonoster/certs";
import {FuncsService} from "./protos/funcs_grpc_pb";
import FuncsServer from "./funcs";
import logger from "@fonoster/logger";

if (!process.env.PUBLIC_URL) {
  logger.error("Didn't find environment variable PUBLIC_URL while is required");
  process.exit(1);
}

const services = [
  {
    name: "Funcs",
    version: "v1beta1",
    service: FuncsService,
    server: new FuncsServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
