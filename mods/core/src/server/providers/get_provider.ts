import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import providerDecoder from '../../common/decoders/provider_decoder'
import { auth } from '../../common/trust_util'

export default async function (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const providerRef = call.request.getRef()

  logger.info('verbose', `@fonos/core getProvider [ref ${providerRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('gateways').get(providerRef)
    callback(null, providerDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}
