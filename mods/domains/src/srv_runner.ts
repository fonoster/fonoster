#!/usr/bin/env node
import DomainsServer from "./service/domains";
import {DomainsService} from "./service/protos/domains_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/core";

const services = [
  {
    name: "Domains",
    version: "v1alpha1",
    service: DomainsService,
    server: new DomainsServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
