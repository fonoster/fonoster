#!/usr/bin/env node
/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import dotenv from "dotenv";
import {join} from "path";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({path: join(__dirname, ".env")});
}

import MonitorServer from "./mods/monitor/src/service/monitor";
import UsersServer from "./mods/users/src/service/users";
import ProjectsServer from "./mods/projects/src/service/projects";
import AuthServer from "./mods/auth/src/service/auth";
import FuncsServer from "./mods/funcs/src/service/funcs";
import AgentsServer from "./mods/agents/src/service/agents";
import SecretServer from "./mods/secrets/src/service/secrets";
import DomainsServer from "./mods/domains/src/service/domains";
import NumbersServer from "./mods/numbers/src/service/numbers";
import ProvidersServer from "./mods/providers/src/service/providers";
import CallManagerServer from "./mods/callmanager/src/service/callmanager";
import StorageServer from "./mods/storage/src/service/storage";
import {MonitorService} from "./mods/monitor/src/service/protos/monitor_grpc_pb";
import {ProjectsService} from "./mods/projects/src/service/protos/projects_grpc_pb";
import {UsersService} from "./mods/users/src/service/protos/users_grpc_pb";
import {AuthService} from "./mods/auth/src/service/protos/auth_grpc_pb";
import {FuncsService} from "./mods/funcs/src/service/protos/funcs_grpc_pb";
import {AgentsService} from "./mods/agents/src/service/protos/agents_grpc_pb";
import {SecretsService} from "./mods/secrets/src/service/protos/secrets_grpc_pb";
import {DomainsService} from "./mods/domains/src/service/protos/domains_grpc_pb";
import {NumbersService} from "./mods/numbers/src/service/protos/numbers_grpc_pb";
import {ProvidersService} from "./mods/providers/src/service/protos/providers_grpc_pb";
import {CallManagerService} from "./mods/callmanager/src/service/protos/callmanager_grpc_pb";
import {StorageService} from "./mods/storage/src/service/protos/storage_grpc_pb";
import runServices from "./mods/common/src/service_runner";
import AuthMiddleware from "./mods/auth/src/auth_middleware";
import {getSalt} from "./mods/certs/src/certs";

const services = [
  {
    name: "monitor",
    version: "v1beta1",
    service: MonitorService,
    server: new MonitorServer()
  },
  {
    name: "users",
    version: "v1beta1",
    service: UsersService,
    server: new UsersServer()
  },
  {
    name: "projects",
    version: "v1beta1",
    service: ProjectsService,
    server: new ProjectsServer()
  },
  {
    name: "auth",
    version: "v1beta1",
    service: AuthService,
    server: new AuthServer()
  },
  {
    name: "funcs",
    version: "v1beta1",
    service: FuncsService,
    server: new FuncsServer()
  },
  {
    name: "agents",
    version: "v1beta1",
    service: AgentsService,
    server: new AgentsServer()
  },
  {
    name: "domains",
    version: "v1beta1",
    service: DomainsService,
    server: new DomainsServer()
  },
  {
    name: "numbers",
    version: "v1beta1",
    service: NumbersService,
    server: new NumbersServer()
  },
  {
    name: "providers",
    version: "v1beta1",
    service: ProvidersService,
    server: new ProvidersServer()
  },
  {
    name: "callmanager",
    version: "v1beta1",
    service: CallManagerService,
    server: new CallManagerServer()
  },
  {
    name: "storage",
    version: "v1beta1",
    service: StorageService,
    server: new StorageServer()
  },
  {
    name: "secrets",
    version: "v1beta1",
    service: SecretsService,
    server: new SecretServer()
  }
];

const whitelist = [
  "/fonoster.monitor.v1beta1.Monitor/SearchEvents",
  "/fonoster.users.v1beta1.Users/ListUsers",
  "/fonoster.users.v1beta1.Users/CreateUser",
  "/fonoster.users.v1beta1.Users/DeleteUser",
  "/fonoster.users.v1beta1.Users/LoginUser",
  "/fonoster.auth.v1beta1.Auth/GetRole",
  "/fonoster.auth.v1beta1.Auth/CreateToken",
  "/fonoster.auth.v1beta1.Auth/CreateNoAccessToken",
  "/fonoster.auth.v1beta1.Secrets/GetSecret",
  "/grpc.health.v1.Health/Check"
];

const middlewares = [
  {
    name: "authentication",
    middlewareObj: new AuthMiddleware(getSalt(), whitelist).middleware
  }
];

runServices(services, middlewares);
