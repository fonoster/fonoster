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

/**
 * @classdesc Fonoster Agents, part of the Fonoster SIP Proxy subsystem,
 * allows you to create, update, retrieve, and delete SIP Agents for your deployment.
 * Note that an active Fonoster deployment is required.
 *
 * @example
 *
 * const SDK = require("@fonoster/sdk");
 *
 * async function main(request) {
 *  const apiKey = "your-api-key";
 *  const accessKeyId = "00000000-0000-0000-0000-000000000000";
 *
 *  try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.loginWithApiKey(apiKey);
 *
 *     const agents = new SDK.Agents(client);
 *     const response = await agents.createAgent(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "John Doe",
 *   username: `1001`,
 *   privacy: "PRIVATE",
 *   enabled: true,
 *   maxContacts: 3
 *   domainRef: "00000000-0000-0000-0000-000000000000"
 * };
 *
 * main(request).catch(console.error);
 */
class Agents {
  private client: FonosterClient;
  /**
   * Constructs a new Agents object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
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

  /**
   * Retrieves an existing Agent in the Workspace.
   *
   * @param {string} ref - The reference of the Agent to retrieve
   * @return {Promise<Acl>} - The response object that contains the Agent information
   * @example
   *
   * const ref = "00000000-0000-0000-0000-000000000000"
   *
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * agents.getAgent(ref)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
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

  /**
   * Retrieves a list of Agents from a Workspace.
   *
   * @param {ListAgentsRequest} request - The request object that contains the necessary information to retrieve a list of Agents
   * @param {number} request.pageSize - The number of Agents to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Agents
   * @return {Promise<ListAgentsResponse>} - The response object that contains the list of Agents
   * @example
   *
   * const request = {
   *  pageSize: 10,
   *  pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * agents.listAgents(request)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
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

  /**
   * Deletes an existing Agent from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Agent to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Agent
   * @example
   *
   * const ref =  "00000000-0000-0000-0000-000000000000"
   *
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * agents.deleteAgent(ref)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
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
