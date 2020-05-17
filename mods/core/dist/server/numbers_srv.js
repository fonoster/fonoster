'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt (value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled (value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected (value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step (result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
Object.defineProperty(exports, '__esModule', { value: true })
const {
  FonosError,
  FonosAuthError,
  FonosInvalidArgument,
  FonosFailedPrecondition
} = require('@fonos/errors')
const AppManagerPB = require('./protos/appmanager_pb')
const routr = require('./routr')
const redis = require('./redis')
const grpc = require('grpc')
const logger = require('../common/logger')
const numberDecoder = require('../common/decoders/number_decoder')
const { Empty } = require('./protos/common_pb')
const { ListNumbersResponse } = require('./protos/numbers_pb')
const { REncoder, Kind } = require('../common/resource_encoder')
const { auth } = require('../common/trust_util')
const listNumbers = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    if (!call.request.getPageToken()) {
      // Nothing to send
      callback(null, new ListNumbersResponse())
      return
    }
    const page = parseInt(call.request.getPageToken()) + 1
    const itemsPerPage = call.request.getPageSize()
    yield routr.connect()
    const result = yield routr
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
  })
const createNumber = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
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
      number.getE164Number()
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
      yield routr.connect()
      if (number.getIngressApp()) {
        const app = yield redis.get(number.getIngressApp())
        if (!app)
          throw new FonosFailedPrecondition(
            `App ${number.ingressApp} doesn't exist`
          )
        yield redis.set(
          `extlink:${number.getE164Number()}`,
          number.getIngressApp()
        )
      }
      const ref = yield routr.resourceType('numbers').create(resource)
      // We do this to get updated metadata from Routr
      const jsonObj = yield routr.resourceType('numbers').get(ref)
      callback(null, numberDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const getNumber = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    const numberRef = call.request.getRef()
    logger.info('verbose', `@fonos/core getNumber [ref ${numberRef}]`)
    try {
      yield routr.connect()
      const jsonObj = yield routr.resourceType('numbers').get(numberRef)
      callback(null, numberDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const updateNumber = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
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
      yield routr.connect()
      const ref = yield routr.resourceType('numbers').update(resource)
      if (number.getIngressApp()) {
        const app = yield redis.get(number.getIngressApp())
        if (!app)
          throw new FonosFailedPrecondition(
            `App ${number.ingressApp} doesn't exist`
          )
        yield redis.set(
          `extlink:${number.getE164Number()}`,
          number.getIngressApp()
        )
      } else {
        yield redis.del(`extlink:${number.getE164Number()}`)
      }
      // We do this to get updated metadata from Routr
      const jsonObj = yield routr.resourceType('numbers').get(ref)
      callback(null, numberDecoder(jsonObj))
    } catch (err) {
      return callback(err)
    }
  })
const deleteNumber = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    const numberRef = call.request.getRef()
    logger.info('verbose', `@fonos/core deleteNumber [ref ${numberRef}]`)
    try {
      yield routr.connect()
      yield routr.resourceType('numbers').delete(numberRef)
      callback(null, new Empty())
    } catch (err) {
      return callback(err)
    }
  })
const getIngressApp = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new FonosAuthError())
    const e164number = call.request.getE164Number()
    const appName = yield redis.get(`extlink:${call.request.getE164Number()}`)
    logger.log('debug', `@fonos/core getIngressApp [appName: ${appName}]`)
    const appFromDB = yield redis.get(appName)
    if (!appFromDB) {
      callback(
        new FonosError(grpc.status.NOT_FOUND, `App ${appName} not found`)
      )
      return
    }
    const app = new AppManagerPB.App(JSON.parse(appFromDB).array)
    callback(null, app)
  })
module.exports.listNumbers = listNumbers
module.exports.createNumber = createNumber
module.exports.getNumber = getNumber
module.exports.deleteNumber = deleteNumber
module.exports.updateNumber = updateNumber
module.exports.getIngressApp = getIngressApp
//# sourceMappingURL=numbers_srv.js.map
