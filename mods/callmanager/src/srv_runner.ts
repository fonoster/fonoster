#!/usr/bin/env node
import CallManagerServer from "./service/callmanager";
import {CallManagerService} from "./service/protos/callmanager_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "callmanager",
    version: "v1alpha1",
    service: CallManagerService,
    server: new CallManagerServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
