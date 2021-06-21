import {FonosService, ServiceOptions} from "@fonos/common";
import {AgentsClient} from "../service/protos/agents_grpc_pb";
import AgentsPB from "../service/protos/agents_pb";
import CommonPB from "../service/protos/common_pb";
import logger from "@fonos/logger";
import {promisifyAll} from "grpc-promise";
import {
  CreateAgentRequest,
  CreateAgentResponse,
  DeleteAgentResponse,
  GetAgentResponse,
  ListAgentsRequest,
  ListAgentsResponse,
  UpdateAgentRequest,
  UpdateAgentResponse
} from "./types";
import grpc from "grpc";

/**
 * @classdesc Use Fonos Agents, a capability of Fonos SIP Proxy subsystem,
 * to create, update, get and delete Agents. Agents requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require("@fonos/sdk")
 * const agents = new Fonos.Agents()
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
export default class Agents extends FonosService {
  /**
   * Constructs a new Agents object.
   *
   * @param {ServiceOptions} options - Options to indicate the objects endpoint
   * @see module:core:FonosService
   */
  constructor(options?: ServiceOptions) {
    super(AgentsClient, options);
    super.init(grpc);
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  /**
   * Creates a new Agent on the SIP Proxy subsystem.
   *
   * @param {CreateAgentRequest} request -  Request for the provision of a new Agent
   * @param {string} request.name - Friendly name for the SIP device
   * @param {string} request.username -Agent's credential username
   * @param {string} request.secret - Agent's credential secret
   * @param {string} request.privacy - If set to "Private" Fonos removes
   * identifiable information for the requests. Defaults to "None"
   * @param {string[]} request.domains - List of domains this Agent has access to
   * @return {Promise<CreateAgentResponse>}
   * @example
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
   *   console.log(result)            // returns the CreateAgentResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createAgent(request: CreateAgentRequest): Promise<CreateAgentResponse> {
    const agent = new AgentsPB.Agent();
    agent.setName(request.name);
    agent.setUsername(request.username);
    agent.setSecret(request.secret);
    agent.setDomainsList(request.domains);
    agent.setPrivacy(request.privacy);

    const outRequest = new AgentsPB.CreateAgentRequest();
    outRequest.setAgent(agent);

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
   * const ref = "507f1f77bcf86cd799439011";
   *
   * agents.getAgent(ref)
   * .then(result => {
   *   console.log(result)             // returns the GetDomainResponse interface
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
    const getAgentRequest = new AgentsPB.GetAgentRequest();
    getAgentRequest.setRef(request.ref);
    const agent = await super
      .getService()
      .getAgent()
      .sendMessage(getAgentRequest);

    if (request.name) agent.setName(request.name);
    if (request.secret) agent.setSecret(request.secret);
    if (request.privacy) agent.setPrivacy(request.privacy);

    const req = new AgentsPB.UpdateAgentRequest();
    req.setAgent(agent);

    const res = await super.getService().updateAgent().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * List registered Agents in Fonos SIP Proxy subsystem.
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
    logger.log(
      "verbose",
      `@fonos/agents listAgent [request -> ${JSON.stringify(request)}]`
    );
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
   * const ref = "507f1f77bcf86cd799439011"
   *
   * agents.deleteAgent(ref)
   * .then(() => {
   *   console.log("done")            // returns a reference of the agent
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteAgent(ref: string): Promise<DeleteAgentResponse> {
    const req = new AgentsPB.DeleteAgentRequest();
    req.setRef(ref);
    await super.getService().deleteAgent().sendMessage(req);
    return {ref};
  }
}

export {AgentsPB, CommonPB};
// WARNING:
// Workaround to support default interop scenario with ES6/common.js 
module.exports = Agents;
