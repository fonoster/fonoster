#!/usr/bin/env node
import NumbersServer from "./service/numbers";
import {NumbersService} from "./service/protos/numbers_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/core";

const services = [
  {
    name: "Numbers",
    version: "v1alpha1",
    service: NumbersService,
    server: new NumbersServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
