/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { AgentsAPI, GetAgentRequest } from "./client";
import {
  Agent,
  CreateAgentRequest,
  DeleteAgentRequest,
  ListAgentsRequest,
  UpdateAgentRequest
} from "./types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Agent";

function createAgent(agents: AgentsAPI) {
  return createResource<Agent, CreateAgentRequest, AgentsAPI>(agents, RESOURCE);
}

function updateAgent(agents: AgentsAPI) {
  return updateResource<Agent, UpdateAgentRequest, AgentsAPI>(agents, RESOURCE);
}

function getAgent(agents: AgentsAPI) {
  return getResource<Agent, GetAgentRequest, AgentsAPI>(agents, RESOURCE);
}

function listAgents(agents: AgentsAPI) {
  return listResources<Agent, ListAgentsRequest, AgentsAPI>(agents, RESOURCE);
}

function deleteAgent(agents: AgentsAPI) {
  return deleteResource<Agent, DeleteAgentRequest, AgentsAPI>(agents, RESOURCE);
}

export { createAgent, updateAgent, getAgent, listAgents, deleteAgent };
