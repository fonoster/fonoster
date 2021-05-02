#!/usr/bin/env node
import AgentsServer from "./client/agents";
import {AgentsService} from "./service/protos/agents_grpc_pb";
import {runServices} from "@fonos/core";

runServices([
  {
    name: "Agents",
    version: "v1alpha1",
    service: AgentsService,
    server: new AgentsServer()
  }
]);
