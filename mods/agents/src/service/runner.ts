#!/usr/bin/env node
import AgentsServer from "./agents";
import {AgentsService} from "./protos/agents_grpc_pb";
import {AuthMiddleware} from "@fonos/auth";
import {getSalt} from "@fonos/certs";
import {runServices} from "@fonos/common";

const services = [
  {
    name: "agents",
    version: "v1beta1",
    service: AgentsService,
    server: new AgentsServer()
  }
];

const middleware = {
  name: "authentication",
  middlewareObj: new AuthMiddleware(getSalt()).middleware
};

runServices(services, [middleware]);
