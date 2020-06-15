import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import domainDecoder from '../../common/decoders/domain_decoder'
import { auth } from '../../common/trust_util'

export default async function (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const domainRef = call.request.getRef()

  logger.info('verbose', `@fonos/core getDomain [ref ${domainRef}]`)

  try {
    await routr.connect()
    const jsonObj = await routr.resourceType('domains').get(domainRef)
    callback(null, domainDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}
