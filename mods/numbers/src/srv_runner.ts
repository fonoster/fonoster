#!/usr/bin/env node

import NumbersServer from "./service/numbers";
import {NumbersService} from "./service/protos/numbers_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "Numbers Service",
  version: "v1alpha1",
  service: NumbersService,
  server: new NumbersServer()
});
