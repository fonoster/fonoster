#!/usr/bin/env node
import CallManagerServer from "./service/callmanager";
import {CallManagerService} from "./service/protos/callmanager_grpc_pb";
import {runServices} from "@fonos/core";

runServices([{
  name: "CallManager",
  version: "v1alpha1",
  service: CallManagerService, 
  server: new CallManagerServer()
}]);
