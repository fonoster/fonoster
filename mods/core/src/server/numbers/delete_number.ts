import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import { Empty } from '../protos/common_pb'
import { auth } from '../../common/trust_util'

export default async function deleteNumber (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const numberRef = call.request.getRef()

  logger.info('verbose', `@fonos/core deleteNumber [ref ${numberRef}]`)

  try {
    await routr.connect()
    await routr.resourceType('numbers').delete(numberRef)
    callback(null, new Empty())
  } catch (err) {
    return callback(err)
  }
}
