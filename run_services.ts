#!/usr/bin/env node
import dotenv from "dotenv";
import {join} from "path";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({path: join(__dirname, ".env")});
}

import AuthServer from "./mods/auth/src/service/auth";
import FuncsServer from "./mods/funcs/src/service/funcs";
import AgentsServer from "./mods/agents/src/service/agents";
import SecretServer from "./mods/secrets/src/service/secrets";
import DomainsServer from "./mods/domains/src/service/domains";
import NumbersServer from "./mods/numbers/src/service/numbers";
import ProvidersServer from "./mods/providers/src/service/providers";
import CallManagerServer from "./mods/callmanager/src/service/callmanager";
import AppManagerServer from "./mods/appmanager/src/service/appmanager";
import StorageServer from "./mods/storage/src/service/storage";
import {AuthService} from "./mods/auth/src/service/protos/auth_grpc_pb";
import {FuncsService} from "./mods/funcs/src/service/protos/funcs_grpc_pb";
import {AgentsService} from "./mods/agents/src/service/protos/agents_grpc_pb";
import {SecretsService} from "./mods/secrets/src/service/protos/secrets_grpc_pb";
import {DomainsService} from "./mods/domains/src/service/protos/domains_grpc_pb";
import {NumbersService} from "./mods/numbers/src/service/protos/numbers_grpc_pb";
import {ProvidersService} from "./mods/providers/src/service/protos/providers_grpc_pb";
import {CallManagerService} from "./mods/callmanager/src/service/protos/callmanager_grpc_pb";
import {AppManagerService} from "./mods/appmanager/src/service/protos/appmanager_grpc_pb";
import {StorageService} from "./mods/storage/src/service/protos/storage_grpc_pb";
import runServices from "./mods/common/src/service_runner";
import AuthMiddleware from "./mods/auth/src/auth_middleware";
import {getSalt} from "./mods/certs/src/certs";

const services = [
  {
    name: "auth",
    version: "v1alpha1",
    service: AuthService,
    server: new AuthServer()
  },
  {
    name: "funcs",
    version: "v1alpha1",
    service: FuncsService,
    server: new FuncsServer()
  },
  {
    name: "agents",
    version: "v1alpha1",
    service: AgentsService,
    server: new AgentsServer()
  },
  {
    name: "domains",
    version: "v1alpha1",
    service: DomainsService,
    server: new DomainsServer()
  },
  {
    name: "numbers",
    version: "v1alpha1",
    service: NumbersService,
    server: new NumbersServer()
  },
  {
    name: "providers",
    version: "v1alpha1",
    service: ProvidersService,
    server: new ProvidersServer()
  },
  {
    name: "callmanager",
    version: "v1alpha1",
    service: CallManagerService,
    server: new CallManagerServer()
  },
  {
    name: "appmanager",
    version: "v1alpha1",
    service: AppManagerService,
    server: new AppManagerServer()
  },
  {
    name: "storage",
    version: "v1alpha1",
    service: StorageService,
    server: new StorageServer()
  },
  {
    name: "secret",
    version: "v1alpha1",
    service: SecretsService,
    server: new SecretServer()
  }
];

const whitelist = [
  "/fonos.auth.v1alpha1.Auth/GetRole",
  "/grpc.health.v1.Health/Check"
];

const middlewares = [
  {
    name: "authentication",
    middlewareObj: new AuthMiddleware(getSalt(), whitelist).middleware
  }
];

runServices(services, middlewares);
