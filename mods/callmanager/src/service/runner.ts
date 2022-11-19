#!/usr/bin/env node
import { Tracer as T } from "@fonoster/common";
T.init("callmanager-service");

import CallManagerServer from "./callmanager";
import { CallManagerService } from "./protos/callmanager_grpc_pb";
import { AuthMiddleware } from "@fonoster/auth";
import { getSalt } from "@fonoster/certs";
import { runServices } from "@fonoster/common";

const services = [
  {
    name: "callmanager",
    version: "v1beta1",
    service: CallManagerService,
    server: new CallManagerServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
