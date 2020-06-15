import {
  FonosAuthError,
  FonosInvalidArgument,
  FonosFailedPrecondition
} from '@fonos/errors'
import routr from '../../common/routr'
import redis from '../../common/redis'
import logger from '@fonos/logger'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'

export default async function createNumber (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const number = call.request.getNumber()

  logger.info(
    'verbose',
    `@fonos/core createNumber [entity ${number.getE164Number()}]`
  )

  if (!number.getE164Number()) {
    callback(
      new FonosInvalidArgument(`e164Number field must be a valid e164 value.`)
    )
    return
  }

  if (number.getAorLink() && number.getIngressApp()) {
    callback(
      new FonosInvalidArgument(
        `'ingressApp' and 'aorLink' are not compatible parameters`
      )
    )
    return
  } else if (!number.getAorLink() && !number.getIngressApp()) {
    callback(
      new FonosInvalidArgument(
        `You must provider either an 'ingressApp' or and 'aorLink'`
      )
    )
    return
  }

  let encoder = new REncoder(
    Kind.NUMBER,
    number.getE164Number(),
    number.getRef()
  ).withGatewayRef(number.getProviderRef())

  if (number.getAorLink()) {
    encoder = encoder.withLocation(
      `tel:${number.getE164Number()}`,
      number.getAorLink()
    )
  } else {
    // TODO: Perhaps I should place this in a ENV
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, 'sip:ast@mediaserver')
      .withMetadata({ ingressApp: number.getIngressApp() })
  }

  const resource = encoder.build()

  logger.log(
    'debug',
    `@fonos/core createNumber [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()

    if (number.getIngressApp()) {
      const app = await redis.get(number.getIngressApp())

      if (!app)
        throw new FonosFailedPrecondition(
          `App ${number.ingressApp} doesn't exist`
        )

      await redis.set(
        `extlink:${number.getE164Number()}`,
        number.getIngressApp()
      )
    }

    //const ref = await routr.resourceType('numbers').create(resource)
    // We do this to get updated metadata from Routr
    //const jsonObj = await routr.resourceType('numbers').get(ref)
    //callback(null, numberDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}
