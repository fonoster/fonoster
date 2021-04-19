#!/usr/bin/env node

import ProvidersServer from "./service/providers";
import {ProvidersService} from "./service/protos/providers_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "Providers Service",
  version: "v1alpha1",
  service: ProvidersService,
  server: new ProvidersServer()
});
