#!/usr/bin/env node
import SecretServer from "./service/secrets";
import {SecretsService} from "./service/protos/secrets_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "secrets",
    version: "v1alpha1",
    service: SecretsService,
    server: new SecretServer()
  }
];

const middleware = {
  name: "Authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
