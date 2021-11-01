#!/usr/bin/env node
import NumbersServer from "./numbers";
import {NumbersService} from "./protos/numbers_grpc_pb";
import {AuthMiddleware} from "@fonoster/auth";
import {getSalt} from "@fonoster/certs";
import {runServices} from "@fonoster/common";

const services = [
  {
    name: "numbers",
    version: "v1beta1",
    service: NumbersService,
    server: new NumbersServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
