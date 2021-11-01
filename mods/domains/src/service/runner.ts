#!/usr/bin/env node
import DomainsServer from "./domains";
import {DomainsService} from "./protos/domains_grpc_pb";
import {AuthMiddleware} from "@fonoster/auth";
import {getSalt} from "@fonoster/certs";
import {runServices} from "@fonoster/common";

const services = [
  {
    name: "domains",
    version: "v1beta1",
    service: DomainsService,
    server: new DomainsServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
