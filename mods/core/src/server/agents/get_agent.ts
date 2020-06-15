import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import agentDecoder from '../../common/decoders/agent_decoder'
import { auth } from '../../common/trust_util'

export default async function getAgent (call: any, callback: any) {
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
