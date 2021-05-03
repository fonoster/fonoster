#!/usr/bin/env node
import UserManagerServer from "./service/usermanager";
import {UserManagerService} from "./service/protos/usermanager_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/core";

const services = [
  {
    name: "UserManager",
    version: "v1alpha1",
    service: UserManagerService,
    server: new UserManagerServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
