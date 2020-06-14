import { FonosError, FonosAuthError, FonosInvalidArgument, FonosFailedPrecondition } from '@fonos/errors'
import routr from '../../common/routr'
import redis from '../../common/redis'
import grpc from 'grpc'
import logger from '@fonos/logger'
import numberDecoder from '../../common/decoders/number_decoder'
import { Empty } from '../protos/common_pb'
import { ListNumbersResponse } from '../protos/numbers_pb'
import { REncoder, Kind } from '../../common/resource_encoder'
import { auth } from '../../common/trust_util'
 
const listNumbers = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  if (!call.request.getPageToken()) {
    // Nothing to send
    callback(null, new ListNumbersResponse())
    return
  }

  const page = parseInt(call.request.getPageToken()) + 1
  const itemsPerPage = call.request.getPageSize()

  await routr.connect()
  const result = await routr
    .resourceType('numbers')
    .list({ page, itemsPerPage })
  const numbers = result.data

  const response = new ListNumbersResponse()

  for (const jsonObj in numbers) {
    const number = numberDecoder(jsonObj)
    response.addNumbers(number)
  }

  if (numbers.length > 0) response.setNextPageToken('' + (page + 1))

  callback(null, response)
}

const createNumber = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const number = call.request.getNumber()

  logger.info(
    'verbose',
    `@fonos/core createNumber [entity ${number.getE164Number()}]`
  )

  if (!number.getE164Number()) {
    callback(
      new FonosInvalidArgument(
        `e164Number field must be a valid e164 value.`
      )
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

const getNumber = async (call: any, callback: any) => {
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

const updateNumber = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const number = call.request.getNumber()

  logger.info(
    'verbose',
    `@fonos/core updateNumber [entity ${number.getE164Number()}]`
  )

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
  )

  if (number.getAorLink()) {
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, number.getAorLink())
      .withMetadata({
        gwRef: number.getProviderRef(),
        createdOn: number.getCreateTime(),
        modifiedOn: number.getUpdateTime()
      })
  } else {
    // TODO: Perhaps I should place this in a ENV
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, 'sip:ast@mediaserver')
      .withMetadata({
        ingressApp: number.getIngressApp(),
        gwRef: number.getProviderRef(),
        createdOn: number.getCreateTime(),
        modifiedOn: number.getUpdateTime()
      })
  }

  const resource = encoder.build()

  logger.log(
    'debug',
    `@fonos/core updateNumber [resource: ${JSON.stringify(resource)}]`
  )

  try {
    await routr.connect()
    const ref = await routr.resourceType('numbers').update(resource)

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
    } else {
      await redis.del(`extlink:${number.getE164Number()}`)
    }

    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType('numbers').get(ref)
    callback(null, numberDecoder(jsonObj))
  } catch (err) {
    return callback(err)
  }
}

const deleteNumber = async (call: any, callback: any) => {
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

const getIngressApp = async (call: any, callback: any) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const e164number = call.request.getE164Number()
  const appName = await redis.get(`extlink:${call.request.getE164Number()}`)

  logger.log('debug', `@fonos/core getIngressApp [appName: ${appName}]`)

  const appFromDB = await redis.get(appName)

  if (!appFromDB) {
    callback(new FonosError( `App ${appName} not found`, grpc.status.NOT_FOUND))
    return
  }

  //const app = new AppManagerPB.App(JSON.parse(appFromDB).array)
  //callback(null, app)
}

export {
  listNumbers,
  createNumber,
  getNumber,
  deleteNumber,
  updateNumber,
  getIngressApp
}

