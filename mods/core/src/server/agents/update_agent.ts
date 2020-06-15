import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import agentDecoder from '../../common/decoders/agent_decoder'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'

export default async function updateAgent (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const agent = call.request.getAgent()

  logger.info('verbose', `@fonos/core updateAgent [entity ${agent.getName()}]`)

  let encoder = new REncoder(Kind.AGENT, agent.getName(), agent.getRef())
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
