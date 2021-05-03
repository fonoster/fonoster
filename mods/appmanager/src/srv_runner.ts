#!/usr/bin/env node
import AppManagerServer from "./service/appmanager";
import {AppManagerService} from "./service/protos/appmanager_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/core";

const services = [
  {
    name: "AppManager",
    version: "v1alpha1",
    service: AppManagerService,
    server: new AppManagerServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
