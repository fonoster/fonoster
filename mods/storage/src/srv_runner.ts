#!/usr/bin/env node

import StorageServer from "./service/storage"
import {StorageService} from "./service/protos/storage_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "Storage Service",
  version: "v1alpha1",
  service: StorageService, 
  server: new StorageServer()
})
