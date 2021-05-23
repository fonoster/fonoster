#!/usr/bin/env node
import AppManagerServer from "./service/appmanager";
import {AppManagerService} from "./service/protos/appmanager_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "appmanager",
    version: "v1alpha1",
    service: AppManagerService,
    server: new AppManagerServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
