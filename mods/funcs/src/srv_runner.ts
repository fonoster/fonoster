#!/usr/bin/env node
import {AuthMiddleware} from "@fonos/auth";
import {runServices} from "@fonos/common";
import {getSalt} from "@fonos/certs";
import {FuncsService} from "./service/protos/funcs_grpc_pb";
import FuncsServer from "./service/funcs";

const services = [
  {
    name: "Funcs",
    version: "v1alpha1",
    service: FuncsService,
    server: new FuncsServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
