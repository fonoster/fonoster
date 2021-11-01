#!/usr/bin/env node
import AgentsServer from "./agents";
import {AgentsService} from "./protos/agents_grpc_pb";
import {AuthMiddleware} from "@fonoster/auth";
import {getSalt} from "@fonoster/certs";
import {runServices} from "@fonoster/common";

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
