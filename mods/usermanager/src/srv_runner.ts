#!/usr/bin/env node
import UserManagerServer from "./service/usermanager";
import {UserManagerService} from "./service/protos/usermanager_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "UserManager Service",
  version: "v1alpha1",
  service: UserManagerService, 
  server: new UserManagerServer()
});
