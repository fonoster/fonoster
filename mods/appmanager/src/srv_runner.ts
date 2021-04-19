#!/usr/bin/env node

import AppManagerServer from "./service/appmanager";
import {AppManagerService} from "./service/protos/appmanager_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "AppManager Service",
  version: "v1alpha1",
  service: AppManagerService,
  server: new AppManagerServer()
});
