#!/usr/bin/env node
import CallManagerServer from "./service/callmanager";
import {CallManagerService} from "./service/protos/callmanager_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "CallManager Service",
  version: "v1alpha1",
  service: CallManagerService, 
  server: new CallManagerServer()
});
