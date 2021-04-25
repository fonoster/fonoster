#!/usr/bin/env node
import UserManagerServer from "./service/usermanager";
import {UserManagerService} from "./service/protos/usermanager_grpc_pb";
import {runServices} from "@fonos/core";

runServices([{
  name: "UserManager",
  version: "v1alpha1",
  service: UserManagerService, 
  server: new UserManagerServer()
}]);
