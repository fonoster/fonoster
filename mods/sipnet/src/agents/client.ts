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
import { JsonObject } from "@prisma/client/runtime/library";
import { Domain } from "../domains/types";

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
  domain?: Domain;
  extended?: JsonObject;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateAgentRequest = {
  name: string;
  username: string;
  privacy: Privacy;
  enabled: boolean;
  maxContacts: number;
  expires?: number;
  domainRef: string;
  extended: {
    accessKeyId: string;
  };
};

type UpdateAgentRequest = {
  ref: string;
} & Omit<Partial<CreateAgentRequest>, "username">;

type CreateAgentResponse = {
  ref: string;
};

type UpdateAgentResponse = {
  ref: string;
};

type GetAgentRequest = {
  ref: string;
};

type DeleteAgentRequest = {
  ref: string;
};

type ListAgentsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListAgentsResponse = {
  items: Agent[];
  nextPageToken: string;
};

type AgentsAPI = {
  createAgent(request: CreateAgentRequest): Promise<CreateAgentResponse>;
  updateAgent(request: UpdateAgentRequest): Promise<UpdateAgentResponse>;
  getAgent(ref: string): Promise<Agent>;
  deleteAgent(ref: string): Promise<void>;
  listAgents(request: ListAgentsRequest): Promise<ListAgentsResponse>;
};

export {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  CreateAgentResponse,
  UpdateAgentResponse,
  GetAgentRequest,
  DeleteAgentRequest,
  ListAgentsRequest,
  ListAgentsResponse,
  AgentsAPI,
  Privacy
};
