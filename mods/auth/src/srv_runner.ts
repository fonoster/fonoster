#!/usr/bin/env node
import AuthServer from "./service/auth";
import {AuthService} from "./service/protos/auth_grpc_pb";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "auth",
    version: "v1alpha1",
    service: AuthService,
    server: new AuthServer()
  }
];

runServices(services, []);
