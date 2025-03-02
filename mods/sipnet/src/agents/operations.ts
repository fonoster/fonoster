/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import { Validators as V } from "@fonoster/common";
import {
  AgentExtended,
  AgentsApi,
  BaseApiObject,
  CreateAgentRequestExtended,
  ListAgentsRequest,
  UpdateAgentRequest
} from "@fonoster/types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Agent";

function createAgent(agents: AgentsApi) {
  return createResource<AgentExtended, CreateAgentRequestExtended, AgentsApi>(
    agents,
    RESOURCE,
    V.createAgentRequestSchema
  );
}

function updateAgent(agents: AgentsApi) {
  return updateResource<AgentExtended, UpdateAgentRequest, AgentsApi>(
    agents,
    RESOURCE,
    V.updateAgentRequestSchema
  );
}

function getAgent(agents: AgentsApi) {
  return getResource<AgentExtended, BaseApiObject, AgentsApi>(agents, RESOURCE);
}

function listAgents(agents: AgentsApi) {
  return listResources<AgentExtended, ListAgentsRequest, AgentsApi>(
    agents,
    RESOURCE
  );
}

function deleteAgent(agents: AgentsApi) {
  return deleteResource<AgentExtended, BaseApiObject, AgentsApi>(
    agents,
    RESOURCE
  );
}

export { createAgent, deleteAgent, getAgent, listAgents, updateAgent };
