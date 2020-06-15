import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'

export default async function createAgent (call: any, callback: any) {
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
