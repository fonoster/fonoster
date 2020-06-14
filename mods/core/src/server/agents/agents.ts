import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import agentDecoder from '../../common/decoders/agent_decoder'
import { Empty } from '../protos/common_pb'
import { ListAgentsResponse } from '../protos/agents_pb'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'

const listAgents = async (call: any, callback: any) => {

  if (!auth(call)) return callback(new FonosAuthError())

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

  for (const jsonObj in agents) {
    const agent = agentDecoder(jsonObj)
    response.addAgents(agent)
  }

  if (agents.length > 0) response.setNextPageToken('' + (page + 1))

  callback(null, response)
}

const createAgent = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const agent = call.request.getAgent()

  logger.info('verbose', `@fonos/core createAgent [entity ${agent.getName()}]`)

  let encoder = new REncoder(Kind.AGENT, agent.getName(), agent.getRef())
    .withCredentials(agent.getUsername(), agent.getSecret())
    .withDomains(agent.getDomainsList())
  //.withPrivacy(provider.getPrivacy()) // TODO

  const resource = encoder.build()

  logger.log(
    'debug',
    `@fonos/core createAgent [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    //const ref = await routr.resourceType('agents').create(resource)
    // We do this to get updated metadata from Routr
    //const jsonObj = await routr.resourceType('agents').get(ref)
    //callback(null, agentDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const getAgent = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const agentRef = call.request.getRef()

  logger.info('verbose', `@fonos/core getAgent [ref ${agentRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('agents').get(agentRef)
    callback(null, agentDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const updateAgent = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const agent = call.request.getAgent()

  logger.info('verbose', `@fonos/core updateAgent [entity ${agent.getName()}]`)

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
    `@fonos/core updateAgent [resource: ${JSON.stringify(resource)}]`
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

const deleteAgent = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const agentRef = call.request.getRef()

  logger.info('verbose', `@fonos/core deleteAgent [ref ${agentRef}]`)

  try {
    await routr.connect()
    await routr.resourceType('agents').delete(agentRef)
    callback(null, new Empty())
  } catch (err) {
    return callback(err)
  }
}

export {
  listAgents,
  createAgent,
  getAgent,
  deleteAgent,
  updateAgent
}
