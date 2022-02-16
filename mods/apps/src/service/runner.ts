#!/usr/bin/env node
import {AuthMiddleware} from "@fonoster/auth";
import {runServices} from "@fonoster/common";
import {getSalt} from "@fonoster/certs";
import {AppsService} from "./protos/apps_grpc_pb";
import AppsServer from "./apps";

const services = [
  {
    name: "Apps",
    version: "v1beta1",
    service: AppsService,
    server: new AppsServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
