/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { Privacy } from "@fonoster/core/src/common/resource_builder";

export interface IAgentsClient {
  createAgent(request: CreateAgentRequest): Promise<CreateAgentResponse>;
  getAgent(ref: string): Promise<GetAgentResponse>;
  updateAgent(request: UpdateAgentRequest): Promise<UpdateAgentResponse>;
  listAgents(request: ListAgentsRequest): Promise<ListAgentsResponse>;
  deleteAgent(ref: string): Promise<DeleteAgentResponse>;
}

export interface Agent {
  ref: string;
  name: string;
  username: string;
  secret: string;
  domains: string[];
  privacy: Privacy;
  createTime: string;
  updateTime: string;
}

export interface CreateAgentRequest {
  name: string;
  username: string;
  secret: string;
  domains: string[];
  privacy?: Privacy;
}

export interface CreateAgentResponse {
  ref: string;
  name: string;
  username: string;
  secret: string;
  domains: string[];
  privacy: Privacy;
  createTime: string;
  updateTime: string;
}

export interface GetAgentResponse {
  ref: string;
  name: string;
  username: string;
  secret: string;
  domains: string[];
  privacy: Privacy;
  createTime: string;
  updateTime: string;
}

export interface UpdateAgentRequest {
  ref: string;
  name?: string;
  secret?: string;
  privacy?: Privacy;
}

export interface UpdateAgentResponse {
  ref: string;
}

export interface ListAgentsRequest {
  pageSize?: number;
  pageToken?: string;
  view?: number;
}

export interface ListAgentsResponse {
  nextPageToken: string;
  agents: Agent[];
}

export interface DeleteAgentResponse {
  ref: string;
}
