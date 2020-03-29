const { logger } = require('@yaps/core')
const { AbstractService, AgentsService, AgentsPB } = require('@yaps/core')
const promisifyAll = require('grpc-promise').promisifyAll

/**
 * @classdesc Use YAPS Agents, a capability of YAPS SIP Proxy subsystem,
 * to create, update, get and delete Agents. YAPS Agents requires of a
 * running YAPS deployment.
 *
 * @extends AbstractService
 * @example
 *
 * const YAPS = require('@yaps/sdk')
 * const agents = new YAPS.Agents()
 *
 * const request = {
 *   name: 'John Doe',
 *   username: 'john',
 *   secret: '1234',
 *   domains: ['sip.local']
 * }
 *
 * agents.createAgent(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Agents extends AbstractService {
  /**
   * Constructs a new Agents object.
   *
   * @see module:core:AbstractService
   */
  constructor (options) {
    super(options, AgentsService.AgentsClient)
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  /**
   * Creates a new Agent on the SIP Proxy subsystem.
   *
   * @param {Object} request -  Request for the provision of a new Agent
   * @param {string} request.name - Friendly name for the SIP device
   * @param {string} request.username -Agent's credential username
   * @param {string} request.secret - Agent's credential secret
   * @param {string[]} request.privacy - If set to 'Private' YAPS removes
   * identifiable information for the requests. Defaults to 'None'
   * @param {string[]} request.domains - List of domains this Agent has access to
   * @return {Promise<Object>} The Agent from the database
   * @example
   *
   * const request = {
   *   name: 'John Doe',
   *   username: 'john',
   *   secret: '1234',
   *   domains: ['sip.local']
   * }
   *
   * agents.createAgent(request)
   * .then(result => {
   *   console.log(result)            // returns the Agent object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createAgent (request) {
    logger.log(
      'verbose',
      `@yaps/agents createAgent [request: ${JSON.stringify(request)}]`
    )

    logger.log(
      'debug',
      `@yaps/agents createAgent [validating agent: ${request.name}]`
    )

    const agent = new AgentsPB.Agent()
    agent.setName(request.name)
    agent.setUsername(request.username)
    agent.setSecret(request.secret)
    agent.setDomainsList(request.domains)
    agent.setPrivacy(request.privacy)

    const req = new AgentsPB.CreateAgentRequest()
    req.setAgent(agent)

    return super
      .getService()
      .createAgent()
      .sendMessage(req)
  }

  /**
   * Retrives a Agent by its reference.
   *
   * @param {string} ref - Reference to Agent
   * @return {Promise<Object>} The agent
   * @throws if ref is null or Agent does not exist
   * @example
   *
   * agents.getAgent(ref)
   * .then(result => {
   *   console.log(result)             // returns the Agent object
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getAgent (ref) {
    const request = new AgentsPB.GetAgentRequest()
    request.setRef(ref)
    return this.service.getAgent().sendMessage(request)
  }

  /**
   * Update a Agent at the SIP Proxy subsystem.
   *
   * @param {Object} request - Request update of an Agent
   * @param {string} request.ref - Reference to the Agent
   * @param {string} request.name - Friendly name for the SIP device
   * @param {string} request.secret - Agent's credential secret
   * @return {Promise<Object>} The Agent from the database
   * @example
   *
   * const request = {
   *   name: 'John Dee',
   *   secret: '12345'
   * }
   *
   * agents.updateAgent(request)
   * .then(result => {
   *   console.log(result)            // returns the Agent from the DB
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateAgent (request) {
    logger.log(
      'verbose',
      `@yaps/agents updateAgent [request: ${JSON.stringify(request)}]`
    )

    const agentFromDB = await this.getAgent(request.ref)

    if (request.name) agentFromDB.setName(request.name)
    if (request.secret) agentFromDB.setSecret(request.secret)
    if (request.privacy) agentFromDB.setPrivacy(request.privacy)

    const req = new AgentsPB.UpdateAgentRequest()
    req.setAgent(agentFromDB)

    return super
      .getService()
      .updateAgent()
      .sendMessage(req)
  }

  /**
   * List the Agents registered in YAPS SIP Proxy subsystem.
   *
   * @param {Object} request
   * @param {agent} request.pageSize - Agent of element per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListAgentsResponse>} List of Agents
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * }
   *
   * agents.listAgents(request)
   * .then(() => {
   *   console.log(result)            // returns a ListAgentsResponse object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async listAgents (request) {
    logger.log(
      'verbose',
      `@yaps/agents listAgent [request -> ${JSON.stringify(request)}]`
    )
    const r = new AgentsPB.ListAgentsRequest()
    r.setPageSize(request.pageSize)
    r.setPageToken(request.pageToken)
    r.setView(request.view)
    return this.service.listAgents().sendMessage(r)
  }

  /**
   * Deletes a Agent from SIP Proxy subsystem.
   *
   * @param {string} ref - Reference to the Agent
   * @example
   *
   * const ref = '507f1f77bcf86cd799439011'
   *
   * agents.deleteAgent(ref)
   * .then(() => {
   *   console.log('done')            // returns an empty object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteAgent (ref) {
    logger.log('verbose', `@yaps/agents deleteAgent [ref: ${ref}]`)

    const req = new AgentsPB.DeleteAgentRequest()
    req.setRef(ref)

    return super
      .getService()
      .deleteAgent()
      .sendMessage(req)
  }

}

module.exports = Agents
