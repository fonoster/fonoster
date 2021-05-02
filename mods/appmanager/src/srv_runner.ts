#!/usr/bin/env node

import AppManagerServer from "./service/appmanager";
import {AppManagerService} from "./service/protos/appmanager_grpc_pb";
import {runServices} from "@fonos/core";

runServices([
  {
    name: "AppManager",
    version: "v1alpha1",
    service: AppManagerService,
    server: new AppManagerServer()
  }
]);
