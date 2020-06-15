import { FonosAuthError } from '@fonos/errors'
import routr from '../../common/routr'
import logger from '@fonos/logger'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'

export default async function (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const provider = call.request.getProvider()

  logger.info(
    'verbose',
    `@fonos/core createProvider [entity ${provider.getName()}]`
  )

  let encoder = new REncoder(
    Kind.GATEWAY,
    provider.getName(),
    provider.getRef()
  )
    .withCredentials(provider.getUsername(), provider.getSecret())
    .withHost(provider.getHost())
    .withTransport(provider.getTransport())
    .withExpires(provider.getExpires())

  const resource = encoder.build()

  logger.log(
    'debug',
    `@fonos/core createProvider [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    //const ref = await routr.resourceType('gateways').create(resource)
    // We do this to get updated metadata from Routr
    //const jsonObj = await routr.resourceType('gateways').get(ref)
    //callback(null, providerDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}
