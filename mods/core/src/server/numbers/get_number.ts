import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import numberDecoder from '../../common/decoders/number_decoder'
import { auth } from '../../common/trust_util'

export default async function getNumber (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const numberRef = call.request.getRef()

  logger.info('verbose', `@fonos/core getNumber [ref ${numberRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('numbers').get(numberRef)
    callback(null, numberDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}
