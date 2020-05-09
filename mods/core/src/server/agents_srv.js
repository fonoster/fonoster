const { YAPSAuthError } = require('@yaps/errors')
const routr = require('./routr')
const redis = require('./redis')
const grpc = require('grpc')
const logger = require('../common/logger')
const agentDecoder = require('../common/decoders/agent_decoder')
const { Empty } = require('./protos/common_pb')
const { ListAgentsResponse } = require('./protos/agents_pb')
const { REncoder, Kind } = require('../common/resource_encoder')
const { auth } = require('../common/trust_util')

const listAgents = async (call, callback) => {
  if (!auth(call)) return callback(new YAPSAuthError())

  if (!call.request.getPageToken()) {
    // Nothing to send
    callback(null, new ListAgentsResponse())
    return
  }

  const page = parseInt(call.request.getPageToken()) + 1
  const itemsPerPage = call.request.getPageSize()

  await routr.connect()
  const result = await routr.resourceType('agents').list({ page, itemsPerPage })
  const agents = result.data

  const response = new ListAgentsResponse()

  for (i = 0; i < agents.length; i++) {
    const jsonObj = agents[i]
    const agent = agentDecoder(jsonObj)
    response.addAgents(agent)
  }

  if (agents.length > 0) response.setNextPageToken('' + (page + 1))

  callback(null, response)
}

const createAgent = async (call, callback) => {
  if (!auth(call)) return callback(new YAPSAuthError())

  const agent = call.request.getAgent()

  logger.info('verbose', `@yaps/core createAgent [entity ${agent.getName()}]`)

  let encoder = new REncoder(Kind.AGENT, agent.getName())
    .withCredentials(agent.getUsername(), agent.getSecret())
    .withDomains(agent.getDomainsList())
  //.withPrivacy(provider.getPrivacy()) // TODO

  const resource = encoder.build()

  logger.log(
    'debug',
    `@yaps/core createAgent [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    const ref = await routr.resourceType('agents').create(resource)
    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType('agents').get(ref)
    callback(null, agentDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const getAgent = async (call, callback) => {
  if (!auth(call)) return callback(new YAPSAuthError())

  const agentRef = call.request.getRef()

  logger.info('verbose', `@yaps/core getAgent [ref ${agentRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('agents').get(agentRef)
    callback(null, agentDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const updateAgent = async (call, callback) => {
  if (!auth(call)) return callback(new YAPSAuthError())

  const agent = call.request.getAgent()

  logger.info('verbose', `@yaps/core updateAgent [entity ${agent.getName()}]`)

  let encoder = new REncoder(
    Kind.AGENT,
    agent.getName(),
    agent.getRef()
  )
    .withCredentials(agent.getUsername(), agent.getSecret())
    .withDomains(agent.getDomainsList())
    .withMetadata({
      createdOn: agent.getCreateTime(),
      modifiedOn: agent.getUpdateTime()
    })
  //.withPrivacy(provider.getPrivacy()) // TODO

  const resource = encoder.build()

  logger.log(
    'debug',
    `@yaps/core updateAgent [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    const ref = await routr.resourceType('agents').update(resource)
    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType('agents').get(ref)
    callback(null, agentDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const deleteAgent = async (call, callback) => {
  if (!auth(call)) return callback(new YAPSAuthError())

  const agentRef = call.request.getRef()

  logger.info('verbose', `@yaps/core deleteAgent [ref ${agentRef}]`)

  try {
    await routr.connect()
    await routr.resourceType('agents').delete(agentRef)
    callback(null, new Empty())
  } catch (err) {
    return callback(err)
  }
}

module.exports.listAgents = listAgents
module.exports.createAgent = createAgent
module.exports.getAgent = getAgent
module.exports.deleteAgent = deleteAgent
module.exports.updateAgent = updateAgent
