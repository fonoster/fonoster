#!/usr/bin/env node

import DomainsServer from "./service/domains";
import {DomainsService} from "./service/protos/domains_grpc_pb";
import {runServices} from "@fonos/core";

runServices([
  {
    name: "Domains",
    version: "v1alpha1",
    service: DomainsService,
    server: new DomainsServer()
  }
]);
