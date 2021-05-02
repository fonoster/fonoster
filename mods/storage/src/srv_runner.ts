#!/usr/bin/env node
import StorageServer from "./service/storage";
import {StorageService} from "./service/protos/storage_grpc_pb";
import {runServices} from "@fonos/core";

runServices([
  {
    name: "Storage",
    version: "v1alpha1",
    service: StorageService,
    server: new StorageServer()
  }
]);
