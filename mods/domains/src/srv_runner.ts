#!/usr/bin/env node

import DomainsServer from "./service/domains";
import {DomainsService} from "./service/protos/domains_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "Storage Service",
  version: "v1alpha1",
  service: DomainsService,
  server: new DomainsServer()
});
