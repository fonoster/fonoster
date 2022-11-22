#!/usr/bin/env node
import { Tracer as T } from "@fonoster/common";
T.init("agents-service");

import AgentsServer from "./agents";
import { AgentsService } from "./protos/agents_grpc_pb";
import { AuthMiddleware, limiterMiddleware } from "@fonoster/auth";
import { getSalt } from "@fonoster/certs";
import { runServices } from "@fonoster/common";

const services = [
  {
    name: "agents",
    version: "v1beta1",
    service: AgentsService,
    server: new AgentsServer()
  }
];

const middlewares = [
  {
    name: "authenticator",
    middlewareObj: new AuthMiddleware(getSalt()).middleware
  },
  {
    name: "limiter",
    middlewareObj: limiterMiddleware
  }
];

runServices(services, middlewares);
