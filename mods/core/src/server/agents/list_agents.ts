import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import agentDecoder from '../../common/decoders/agent_decoder'
import { ListAgentsResponse } from '../protos/agents_pb'
import { auth } from '../../common/trust_util'

export default async function listAgents (call: any, callback: any) {
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
