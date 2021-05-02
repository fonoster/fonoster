#!/usr/bin/env node

import NumbersServer from "./service/numbers";
import {NumbersService} from "./service/protos/numbers_grpc_pb";
import {runServices} from "@fonos/core";

runServices([
  {
    name: "Numbers",
    version: "v1alpha1",
    service: NumbersService,
    server: new NumbersServer()
  }
]);
