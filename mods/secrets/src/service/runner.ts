#!/usr/bin/env node
require("@fonoster/common").Tracer.init("secrets-service");
import SecretServer from "./secrets";
import { SecretsService } from "./protos/secrets_grpc_pb";
import { AuthMiddleware } from "@fonoster/auth";
import { getSalt } from "@fonoster/certs";
import { runServices } from "@fonoster/common";

const services = [
  {
    name: "secrets",
    version: "v1beta1",
    service: SecretsService,
    server: new SecretServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
