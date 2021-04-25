#!/usr/bin/env node

import ProvidersServer from "./service/providers";
import {ProvidersService} from "./service/protos/providers_grpc_pb";
import {runServices} from "@fonos/core";

runServices([{
  name: "Providers",
  version: "v1alpha1",
  service: ProvidersService,
  server: new ProvidersServer()
}]);
