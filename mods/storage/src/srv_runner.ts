import {runService} from "@fonos/core";
import StorageServer from "./service/storage"
import {IStorageServer, StorageService} from "./service/protos/storage_grpc_pb";

runService({
  name: "Storage Service",
  version: "v1alpha1",
  service: StorageService, 
  server: new StorageServer()
})
