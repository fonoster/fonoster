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
import {
  Agent,
  CreateAgentRequest,
  CreateAgentResponse,
  DeleteAgentRequest,
  DeleteAgentResponse,
  GetAgentRequest,
  ListAgentsRequest,
  ListAgentsResponse,
  UpdateAgentRequest,
  UpdateAgentResponse
} from "../../generated/web/agents_pb";
import { ClientFunction } from "./common";

type AgentsClient = {
  createAgent: ClientFunction<CreateAgentRequest, CreateAgentResponse>;
  getAgent: ClientFunction<GetAgentRequest, Agent>;
  updateAgent: ClientFunction<UpdateAgentRequest, UpdateAgentResponse>;
  listAgents: ClientFunction<ListAgentsRequest, ListAgentsResponse>;
  deleteAgent: ClientFunction<DeleteAgentRequest, DeleteAgentResponse>;
};

export { AgentsClient };
