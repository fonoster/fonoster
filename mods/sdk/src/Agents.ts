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
import {
  Agent,
  BaseApiObject,
  CreateAgentRequest,
  ListAgentsRequest,
  ListAgentsResponse,
  UpdateAgentRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  Agent as AgentPB,
  CreateAgentRequest as CreateAgentRequestPB,
  CreateAgentResponse as CreateAgentResponsePB,
  DeleteAgentRequest as DeleteAgentRequestPB,
  DeleteAgentResponse as DeleteAgentResponsePB,
  GetAgentRequest as GetAgentRequestPB,
  ListAgentsRequest as ListAgentsRequestPB,
  ListAgentsResponse as ListAgentsResponsePB,
  Privacy,
  UpdateAgentRequest as UpdateAgentRequestPB,
  UpdateAgentResponse as UpdateAgentResponsePB
} from "./generated/node/agents_pb";

class Agents {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createAgent(request: CreateAgentRequest): Promise<BaseApiObject> {
    const client = this.client.getAgentsClient();
    return await makeRpcRequest<
      CreateAgentRequestPB,
      CreateAgentResponsePB,
      CreateAgentRequest,
      BaseApiObject
    >({
      method: client.createAgent.bind(client),
      requestPBObjectConstructor: CreateAgentRequestPB,
      metadata: this.client.getMetadata(),
      request,
      enumMapping: [["privacy", Privacy]]
    });
  }

  async getAgent(ref: string) {
    const client = this.client.getAgentsClient();
    return await makeRpcRequest<
      GetAgentRequestPB,
      AgentPB,
      BaseApiObject,
      Agent
    >({
      method: client.getAgent.bind(client),
      requestPBObjectConstructor: GetAgentRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  async updateAgent(request: UpdateAgentRequest): Promise<BaseApiObject> {
    const client = this.client.getAgentsClient();
    return await makeRpcRequest<
      UpdateAgentRequestPB,
      UpdateAgentResponsePB,
      UpdateAgentRequest,
      BaseApiObject
    >({
      method: client.updateAgent.bind(client),
      requestPBObjectConstructor: UpdateAgentRequestPB,
      metadata: this.client.getMetadata(),
      request,
      enumMapping: [["privacy", Privacy]]
    });
  }

  async listAgents(request: ListAgentsRequest): Promise<ListAgentsResponse> {
    const client = this.client.getAgentsClient();
    return await makeRpcRequest<
      ListAgentsRequestPB,
      ListAgentsResponsePB,
      ListAgentsRequest,
      ListAgentsResponse
    >({
      method: client.listAgents.bind(client),
      requestPBObjectConstructor: ListAgentsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", AgentPB]]
    });
  }

  async deleteAgent(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getAgentsClient();
    return await makeRpcRequest<
      DeleteAgentRequestPB,
      DeleteAgentResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteAgent.bind(applicationsClient),
      requestPBObjectConstructor: DeleteAgentRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Agents };
