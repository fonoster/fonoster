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
import { APIClient, ClientOptions } from "@fonoster/common";
import { AgentsClient } from "../service/protos/agents_grpc_pb";
import AgentsPB from "../service/protos/agents_pb";
import CommonPB from "../service/protos/common_pb";
import { promisifyAll } from "grpc-promise";
import { Privacy } from "@fonoster/core/src/common/resource_builder";
import {
  Agent,
  CreateAgentRequest,
  CreateAgentResponse,
  DeleteAgentResponse,
  GetAgentResponse,
  IAgentsClient,
  ListAgentsRequest,
  ListAgentsResponse,
  UpdateAgentRequest,
  UpdateAgentResponse
} from "./types";

/**
 * @classdesc Use Fonoster Agents, a capability of Fonoster SIP Proxy subsystem,
 * to create, update, get and delete Agents. Agents requires of a
 * running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk")
 * const agents = new Fonoster.Agents()
 *
 * const request = {
 *   name: "John Doe",
 *   username: "john",
 *   secret: "1234",
 *   domains: ["sip.local"]
 * }
 *
 * agents.createAgent(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Agents extends APIClient implements IAgentsClient {
  /**
   * Constructs a new Agents object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(AgentsClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Creates a new Agent on the SIP Proxy subsystem.
   *
   * @param {CreateAgentRequest} request -  Request for the provision of a new Agent
   * @param {string} request.name - Friendly name for the SIP device
   * @param {string} request.username -Agent's credential username
   * @param {string} request.secret - Agent's credential secret
   * @param {Privacy} request.privacy - If set to Privacy.PRIVATE Fonoster removes
   * identifiable information for the requests. Defaults to Privacy.NONE
   * @param {string[]} request.domains - List of domains this Agent has access to
   * @return {Promise<CreateAgentResponse>}
   * @example
   *
   * const request = {
   *   name: "John Doe",
   *   username: "john",
   *   secret: "1234",
   *   domains: ["sip.local"]
   *   privacy: Privacy.PRIVATE
   * }
   *
   * agents.createAgent(request)
   * .then(result => {
   *   console.log(result)            // returns the CreateAgentResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createAgent(request: CreateAgentRequest): Promise<CreateAgentResponse> {
    const outRequest = new AgentsPB.CreateAgentRequest();
    outRequest.setName(request.name);
    outRequest.setUsername(request.username);
    outRequest.setSecret(request.secret);
    outRequest.setDomainsList(request.domains);
    outRequest.setPrivacy(request.privacy);

    const res = await super.getService().createAgent().sendMessage(outRequest);

    return {
      ref: res.getRef(),
      name: res.getName(),
      username: res.getUsername(),
      secret: res.getSecret(),
      domains: res.getDomainsList(),
      privacy: res.getPrivacy(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Retrives an Agent by reference.
   *
   * @param {string} ref - Reference to Agent
   * @return {Promise<GetAgentResponse>} The agent
   * @throws if ref is null or Agent does not exist
   * @example
   *
   * const ref = "aynB1z0tzd";
   *
   * agents.getAgent(ref)
   * .then(result => {
   *   console.log(result)             // returns the GetAgentResponse interface
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getAgent(ref: string): Promise<GetAgentResponse> {
    const request = new AgentsPB.GetAgentRequest();
    request.setRef(ref);
    const res = await super.getService().getAgent().sendMessage(request);

    return {
      ref: res.getRef(),
      name: res.getName(),
      username: res.getUsername(),
      secret: res.getSecret(),
      domains: res.getDomainsList(),
      privacy: res.getPrivacy(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Update an Agent at the SIP Proxy subsystem.
   *
   * @param {UpdateAgentRequest} request - Request update of an Agent
   * @param {string} request.ref - Reference to the Agent
   * @param {string} request.name - Friendly name for the SIP device
   * @param {string} request.secret - Agent's credential secret
   * @return {Promise<UpdateAgentResponse>}
   * @example
   *
   * const request = {
   *   name: "John Dee",
   *   secret: "12345"
   * }
   *
   * agents.updateAgent(request)
   * .then(result => {
   *   console.log(result)            // returns the UpdateAgentResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateAgent(request: UpdateAgentRequest): Promise<UpdateAgentResponse> {
    const req = new AgentsPB.UpdateAgentRequest();
    req.setRef(request.ref);

    if (request.name) req.setName(request.name);
    if (request.secret) req.setSecret(request.secret);
    if (request.privacy) req.setPrivacy(request.privacy);

    const res = await super.getService().updateAgent().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * List registered Agents in Fonoster SIP Proxy subsystem.
   *
   * @param {ListAgentsRequest} request - Optional parameter with size and
   * token for the request
   * @param {number} request.pageSize - Elements per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListAgentsResponse>} Paginated List of Agents
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * }
   *
   * agents.listAgents(request)
   * .then(() => {
   *   console.log(result)            // returns a ListAgentsResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async listAgents(request: ListAgentsRequest): Promise<ListAgentsResponse> {
    const r = new AgentsPB.ListAgentsRequest();
    r.setPageSize(request.pageSize);
    r.setPageToken(request.pageToken);
    r.setView(request.view);
    const paginatedList = await super.getService().listAgents().sendMessage(r);

    return {
      nextPageToken: paginatedList.getNextPageToken(),
      agents: paginatedList.getAgentsList().map((a: AgentsPB.Agent) => {
        return {
          ref: a.getRef(),
          name: a.getName(),
          username: a.getUsername(),
          secret: a.getSecret(),
          domains: a.getDomainsList(),
          privacy: a.getPrivacy(),
          createTime: a.getCreateTime(),
          updateTime: a.getUpdateTime()
        };
      })
    };
  }

  /**
   * Deletes an Agent from the SIP Proxy subsystem.
   *
   * @param {string} ref - Agent's reference
   * @example
   *
   * const ref = "aynB1z0tzd"
   *
   * agents.deleteAgent(ref)
   * .then(() => {
   *   console.log("done")            // returns a reference of the Agent
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteAgent(ref: string): Promise<DeleteAgentResponse> {
    const req = new AgentsPB.DeleteAgentRequest();
    req.setRef(ref);
    await super.getService().deleteAgent().sendMessage(req);
    return { ref };
  }
}

export { Agent, Privacy, AgentsPB, CommonPB, IAgentsClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Agents;
module.exports.Privacy = Privacy;
module.exports.AgentsPB = AgentsPB;
module.exports.CommonPB = CommonPB;
