#!/usr/bin/env node
import { Tracer as T } from "@fonoster/common";
T.init("funcs-service");

import { AuthMiddleware } from "@fonoster/auth";
import { runServices } from "@fonoster/common";
import { getSalt } from "@fonoster/certs";
import { FuncsService } from "./protos/funcs_grpc_pb";
import FuncsServer from "./funcs";

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
