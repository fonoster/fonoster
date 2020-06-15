import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import { Empty } from '../protos/common_pb'
import { auth } from '../../common/trust_util'

export default async function deleteAgent (call: any, callback: any) {
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
