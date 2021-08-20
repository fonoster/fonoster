#!/usr/bin/env node
import SecretServer from "./secrets";
import {SecretsService} from "./protos/secrets_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

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
