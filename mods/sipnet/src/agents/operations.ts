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
import { AgentsApi, GetAgentRequest } from "./client";
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

function createAgent(agents: AgentsApi) {
  return createResource<Agent, CreateAgentRequest, AgentsApi>(agents, RESOURCE);
}

function updateAgent(agents: AgentsApi) {
  return updateResource<Agent, UpdateAgentRequest, AgentsApi>(agents, RESOURCE);
}

function getAgent(agents: AgentsApi) {
  return getResource<Agent, GetAgentRequest, AgentsApi>(agents, RESOURCE);
}

function listAgents(agents: AgentsApi) {
  return listResources<Agent, ListAgentsRequest, AgentsApi>(agents, RESOURCE);
}

function deleteAgent(agents: AgentsApi) {
  return deleteResource<Agent, DeleteAgentRequest, AgentsApi>(agents, RESOURCE);
}

export { createAgent, updateAgent, getAgent, listAgents, deleteAgent };
