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
  Privacy as PrivacyPB,
  UpdateAgentRequest as UpdateAgentRequestPB,
  UpdateAgentResponse as UpdateAgentResponsePB
} from "./generated/node/agents_pb";

/**
 * @classdesc Fonoster Agents, part of the Fonoster SIP Proxy subsystem,
 * allows you to create, update, retrieve, and delete SIP Agents for your deployment.
 * Note that an active Fonoster deployment is required.
 *
 * @example
 * const SDK = require("@fonoster/sdk");
 *
 * async function main(request) {
 *   const apiKey = "your-api-key";
 *   const apiSecret = "your-api-secret"
 *   const accessKeyId = "WO00000000000000000000000000000000";
 *
 *   try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.loginWithApiKey(apiKey, apiSecret);
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
 *   username: "1001",
 *   privacy: "PRIVATE",
 *   enabled: true,
 *   maxContacts: 3
 *   domainRef: "00000000-0000-0000-0000-000000000000"
 * };
 *
 * main(request);
 */
class Agents {
  private readonly client: FonosterClient;
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

  /**
   * Creates a new Agent in the Workspace.
   *
   * @param {CreateAgentRequest} request - The request object that contains the necessary information to create a new Agent
   * @param {string} request.name - The name of the Agent
   * @param {string} request.username - The username of the Agent
   * @param {Privacy} request.privacy - The privacy of the Agent
   * @param {boolean} request.enabled - The status of the Agent
   * @param {number} request.maxContacts - The maximum number of contacts the Agent can have
   * @param {string} request.domainRef - The reference of the Domain to associate the Agent
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Agent
   * @example
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * const request = {
   *   name: "John Doe",
   *   username: "1001",
   *   privacy: "PRIVATE",
   *   enabled: true,
   *   maxContacts: 3
   *   domainRef: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * agents
   *   .createAgent(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
      enumMapping: [["privacy", PrivacyPB]]
    });
  }

  /**
   * Retrieves an existing Agent in the Workspace.
   *
   * @param {string} ref - The reference of the Agent to retrieve
   * @return {Promise<Acl>} - The response object that contains the Agent information
   * @example
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * agents
   *   .getAgent(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getAgent(ref: string): Promise<Agent> {
    const client = this.client.getAgentsClient();
    const response = await makeRpcRequest<
      GetAgentRequestPB,
      AgentPB,
      BaseApiObject,
      Agent
    >({
      method: client.getAgent.bind(client),
      requestPBObjectConstructor: GetAgentRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref },
      enumMapping: [["privacy", PrivacyPB]]
    });

    const credentials = (
      response?.credentials as unknown as {
        toObject: () => {
          ref: string;
          name: string;
          username: string;
        };
      }
    )?.toObject();

    const domain = (
      response?.domain as unknown as {
        toObject: () => {
          ref: string;
          name: string;
          domainUri: string;
        };
      }
    )?.toObject();

    return response
      ? {
          ...response,
          credentials,
          domain
        }
      : null;
  }

  /**
   * Updates an existing Agent in the Workspace.
   *
   * @param {UpdateAgentRequest} request - The request object that contains the necessary information to update an existing Agent
   * @param {string} request.ref - The reference of the Agent to update
   * @param {string} request.name - The name of the Agent
   * @param {Privacy} request.privacy - The privacy of the Agent
   * @param {boolean} request.enabled - The status of the Agent
   * @param {number} request.maxContacts - The maximum number of contacts the Agent can have
   * @param {string} request.domainRef - The reference of the Domain to associate the Agent
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Agent
   * @example
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "John Doe",
   *   privacy: "PRIVATE",
   *   enabled: true,
   *   maxContacts: 3
   *   domainRef: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * agents
   *   .updateAgent(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
      enumMapping: [["privacy", PrivacyPB]]
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
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * const request = {
   *  pageSize: 10,
   *  pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * agents
   *   .listAgents(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async listAgents(request: ListAgentsRequest): Promise<ListAgentsResponse> {
    const client = this.client.getAgentsClient();
    const response = await makeRpcRequest<
      ListAgentsRequestPB,
      ListAgentsResponsePB,
      ListAgentsRequest,
      ListAgentsResponse
    >({
      method: client.listAgents.bind(client),
      requestPBObjectConstructor: ListAgentsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      enumMapping: [["privacy", PrivacyPB]],
      repeatableObjectMapping: [["itemsList", AgentPB]]
    });

    // Manually extract nested objects for each agent
    const processedItems = response.items?.map((agent: any) => {
      const credentials = (
        agent?.credentials as unknown as {
          toObject: () => {
            ref: string;
            name: string;
            username: string;
          };
        }
      )?.toObject();

      const domain = (
        agent?.domain as unknown as {
          toObject: () => {
            ref: string;
            name: string;
            domainUri: string;
          };
        }
      )?.toObject();

      return {
        ...agent,
        credentials,
        domain
      };
    });

    return {
      ...response,
      items: processedItems || []
    };
  }

  /**
   * Deletes an existing Agent from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Agent to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Agent
   * @example
   * const agents = new SDK.Agents(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * agents
   *   .deleteAgent(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
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
