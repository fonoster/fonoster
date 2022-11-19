#!/usr/bin/env node
require("@fonoster/common").Tracer.init("storage-service");
import StorageServer from "./storage";
import { StorageService } from "./protos/storage_grpc_pb";
import { AuthMiddleware } from "@fonoster/auth";
import { getSalt } from "@fonoster/certs";
import { runServices } from "@fonoster/common";

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
