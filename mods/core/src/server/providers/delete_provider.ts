import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import { Empty } from '../protos/common_pb'
import { auth } from '../../common/trust_util'

export default async function (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const providerRef = call.request.getRef()

  logger.info('verbose', `@fonos/core deleteProvider [ref ${providerRef}]`)

  try {
    await routr.connect()
    await routr.resourceType('gateways').delete(providerRef)
    callback(null, new Empty())
  } catch (err) {
    return callback(err)
  }
}
