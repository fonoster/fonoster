#!/usr/bin/env node
import AgentsServer from "./service/agents";
import {AgentsService} from "./service/protos/agents_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "agents",
    version: "v1alpha1",
    service: AgentsService,
    server: new AgentsServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
