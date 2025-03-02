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
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { Flatten, RenameAndConvertToTimestamp } from "./utils";

enum Privacy {
  PRIVATE = "ID",
  NONE = "NONE"
}

type Agent = {
  ref: string;
  name: string;
  username: string;
  privacy: Privacy;
  enabled: boolean;
  maxContacts?: number;
  expires?: number;
  domain?: {
    ref: string;
    name: string;
    domainUri: string;
  };
  credentials?: {
    ref: string;
    name: string;
    username: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

type AgentExtended = RenameAndConvertToTimestamp<Agent> & {
  extended?: Record<string, unknown>;
};

type CreateAgentRequest = {
  name: string;
  username: string;
  privacy: Privacy;
  enabled: boolean;
  maxContacts: number;
  expires: number;
  domainRef?: string;
  credentialsRef?: string;
};

type CreateAgentRequestExtended = CreateAgentRequest & {
  extended?: Record<string, unknown>;
};

type UpdateAgentRequest = Flatten<
  BaseApiObject & Omit<Partial<CreateAgentRequest>, "username" | "extended">
>;

type ListAgentsRequest = ListRequest;

type ListAgentsResponse = ListResponse<Agent>;

type ListAgentsResponseExtended = ListResponse<AgentExtended>;

type AgentsApi = {
  createAgent(request: CreateAgentRequestExtended): Promise<BaseApiObject>;
  updateAgent(request: UpdateAgentRequest): Promise<BaseApiObject>;
  getAgent(ref: string): Promise<AgentExtended>;
  deleteAgent(ref: string): Promise<void>;
  listAgents(request: ListAgentsRequest): Promise<ListAgentsResponseExtended>;
};

export {
  Agent,
  AgentExtended,
  AgentsApi,
  CreateAgentRequest,
  CreateAgentRequestExtended,
  ListAgentsRequest,
  ListAgentsResponse,
  Privacy,
  UpdateAgentRequest
};
