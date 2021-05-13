#!/usr/bin/env node
import dotenv from "dotenv";
import {join} from "path";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({path: join(__dirname, ".env")});
}

import FuncsServer from "./mods/funcs/src/service/funcs";
import AgentsServer from "./mods/agents/src/service/agents";
import DomainsServer from "./mods/domains/src/service/domains";
import NumbersServer from "./mods/numbers/src/service/numbers";
import ProvidersServer from "./mods/providers/src/service/providers";
import CallManagerServer from "./mods/callmanager/src/service/callmanager";
import AppManagerServer from "./mods/appmanager/src/service/appmanager";
import StorageServer from "./mods/storage/src/service/storage";
import UserManagerServer from "./mods/usermanager/src/service/usermanager";
import {FuncsService} from "./mods/funcs/src/service/protos/funcs_grpc_pb";
import {AgentsService} from "./mods/agents/src/service/protos/agents_grpc_pb";
import {DomainsService} from "./mods/domains/src/service/protos/domains_grpc_pb";
import {NumbersService} from "./mods/numbers/src/service/protos/numbers_grpc_pb";
import {ProvidersService} from "./mods/providers/src/service/protos/providers_grpc_pb";
import {CallManagerService} from "./mods/callmanager/src/service/protos/callmanager_grpc_pb";
import {AppManagerService} from "./mods/appmanager/src/service/protos/appmanager_grpc_pb";
import {StorageService} from "./mods/storage/src/service/protos/storage_grpc_pb";
import {UserManagerService} from "./mods/usermanager/src/service/protos/usermanager_grpc_pb";

import runServices from "./mods/core/src/service_runner";

//  Temporarily removing the authentication middleware to avoid Mongoose complication error
//  import {AuthMiddleware} from "@fonos/auth";
//  import {getSalt} from "./mods/certs/src/certs";

const services = [
  {
    name: "Funcs",
    version: "v1alpha1",
    service: FuncsService,
    server: new FuncsServer()
  },
  {
    name: "Agents",
    version: "v1alpha1",
    service: AgentsService,
    server: new AgentsServer()
  },
  {
    name: "Domains",
    version: "v1alpha1",
    service: DomainsService,
    server: new DomainsServer()
  },
  {
    name: "Numbers",
    version: "v1alpha1",
    service: NumbersService,
    server: new NumbersServer()
  },
  {
    name: "Providers",
    version: "v1alpha1",
    service: ProvidersService,
    server: new ProvidersServer()
  },
  {
    name: "CallManager",
    version: "v1alpha1",
    service: CallManagerService,
    server: new CallManagerServer()
  },
  {
    name: "AppManager",
    version: "v1alpha1",
    service: AppManagerService,
    server: new AppManagerServer()
  },
  {
    name: "Storage",
    version: "v1alpha1",
    service: StorageService,
    server: new StorageServer()
  },
  {
    name: "UserManager",
    version: "v1alpha1",
    service: UserManagerService,
    server: new UserManagerServer()
  }
];

//  const middlewares = [
//  {
//    name: "Authentication",
//    middlewareObj: new AuthMiddleware(getSalt()).middleware
//   }
//  ];

runServices(services, []);
