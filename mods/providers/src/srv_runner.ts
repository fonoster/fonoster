#!/usr/bin/env node
import ProvidersServer from "./service/providers";
import {ProvidersService} from "./service/protos/providers_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "providers",
    version: "v1alpha1",
    service: ProvidersService,
    server: new ProvidersServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
