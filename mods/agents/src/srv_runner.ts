#!/usr/bin/env node

import AgentsServer from "./client/agents"
import {AgentsService} from "./service/protos/agents_grpc_pb";
import {runService} from "@fonos/core";

runService({
  name: "Agents Service",
  version: "v1alpha1",
  service: AgentsService, 
  server: new AgentsServer()
})
