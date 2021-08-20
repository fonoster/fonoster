#!/usr/bin/env node
import StorageServer from "./storage";
import {StorageService} from "./protos/storage_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "storage",
    version: "v1beta1",
    service: StorageService,
    server: new StorageServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
