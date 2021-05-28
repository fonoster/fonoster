#!/usr/bin/env node
import StorageServer from "./service/storage";
import {StorageService} from "./service/protos/storage_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "storage",
    version: "v1alpha1",
    service: StorageService,
    server: new StorageServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
