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
import { BaseApiObject } from "./common";

enum Privacy {
  PRIVATE = "ID",
  NONE = "NONE"
}

type AgentExtended = {
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
  extended: Record<string, unknown>;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateAgentRequestExtended = {
  name: string;
  username: string;
  privacy?: Privacy;
  enabled?: boolean;
  maxContacts?: number;
  expires?: number;
  domainRef?: string;
  credentialsRef?: string;
  extended: {
    accessKeyId: string;
  };
};

type UpdateAgentRequest = BaseApiObject &
  Omit<Partial<CreateAgentRequestExtended>, "username" | "extended">;

type ListAgentsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListAgentsResponse = {
  items: Agent[];
  nextPageToken: string;
};

type AgentsApi = {
  createAgent(request: CreateAgentRequestExtended): Promise<BaseApiObject>;
  updateAgent(request: UpdateAgentRequest): Promise<BaseApiObject>;
  getAgent(ref: string): Promise<AgentExtended>;
  deleteAgent(ref: string): Promise<void>;
  listAgents(request: ListAgentsRequest): Promise<ListAgentsResponse>;
};

type Agent = Omit<AgentExtended, "extended">;

type CreateAgentRequest = Omit<CreateAgentRequestExtended, "extended">;

export {
  AgentExtended,
  Agent,
  CreateAgentRequestExtended,
  CreateAgentRequest,
  UpdateAgentRequest,
  ListAgentsRequest,
  ListAgentsResponse,
  AgentsApi,
  Privacy
};
