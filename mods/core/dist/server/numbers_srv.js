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
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: []
      },
      f,
      y,
      t,
      g
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb (n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step (op) {
      if (f) throw new TypeError('Generator is already executing.')
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
var _this = this
var _a = require('@yaps/errors'),
  YAPSError = _a.YAPSError,
  YAPSAuthError = _a.YAPSAuthError,
  YAPSInvalidArgument = _a.YAPSInvalidArgument,
  YAPSFailedPrecondition = _a.YAPSFailedPrecondition
var AppManagerPB = require('./protos/appmanager_pb')
var routr = require('./routr')
var redis = require('./redis')
var grpc = require('grpc')
var logger = require('../common/logger')
var numberDecoder = require('../common/decoders/number_decoder')
var Empty = require('./protos/common_pb').Empty
var ListNumbersResponse = require('./protos/numbers_pb').ListNumbersResponse
var _b = require('../common/resource_encoder'),
  REncoder = _b.REncoder,
  Kind = _b.Kind
var auth = require('../common/trust_util').auth
var listNumbers = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var page, itemsPerPage, result, numbers, response, jsonObj, number
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          if (!call.request.getPageToken()) {
            // Nothing to send
            callback(null, new ListNumbersResponse())
            return [2 /*return*/]
          }
          page = parseInt(call.request.getPageToken()) + 1
          itemsPerPage = call.request.getPageSize()
          return [4 /*yield*/, routr.connect()]
        case 1:
          _a.sent()
          return [
            4 /*yield*/,
            routr
              .resourceType('numbers')
              .list({ page: page, itemsPerPage: itemsPerPage })
          ]
        case 2:
          result = _a.sent()
          numbers = result.data
          response = new ListNumbersResponse()
          for (i = 0; i < numbers.length; i++) {
            jsonObj = numbers[i]
            number = numberDecoder(jsonObj)
            response.addNumbers(number)
          }
          if (numbers.length > 0) response.setNextPageToken('' + (page + 1))
          callback(null, response)
          return [2 /*return*/]
      }
    })
  })
}
var createNumber = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var number, encoder, resource, app, ref, jsonObj, err_1
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          number = call.request.getNumber()
          logger.info(
            'verbose',
            '@yaps/core createNumber [entity ' + number.getE164Number() + ']'
          )
          if (!number.getE164Number()) {
            callback(
              new YAPSInvalidArgument(
                'e164Number field must be a valid e164 value.'
              )
            )
            return [2 /*return*/]
          }
          if (number.getAorLink() && number.getIngressApp()) {
            callback(
              new YAPSInvalidArgument(
                "'ingressApp' and 'aorLink' are not compatible parameters"
              )
            )
            return [2 /*return*/]
          } else if (!number.getAorLink() && !number.getIngressApp()) {
            callback(
              new YAPSInvalidArgument(
                "You must provider either an 'ingressApp' or and 'aorLink'"
              )
            )
            return [2 /*return*/]
          }
          encoder = new REncoder(
            Kind.NUMBER,
            number.getE164Number()
          ).withGatewayRef(number.getProviderRef())
          if (number.getAorLink()) {
            encoder = encoder.withLocation(
              'tel:' + number.getE164Number(),
              number.getAorLink()
            )
          } else {
            // TODO: Perhaps I should place this in a ENV
            encoder = encoder
              .withLocation(
                'tel:' + number.getE164Number(),
                'sip:ast@mediaserver'
              )
              .withMetadata({ ingressApp: number.getIngressApp() })
          }
          resource = encoder.build()
          logger.log(
            'debug',
            '@yaps/core createNumber [resource: ' +
              JSON.stringify(resource) +
              ']'
          )
          _a.label = 1
        case 1:
          _a.trys.push([1, 8, , 9])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          if (!number.getIngressApp()) return [3 /*break*/, 5]
          return [4 /*yield*/, redis.get(number.getIngressApp())]
        case 3:
          app = _a.sent()
          if (!app)
            throw new YAPSFailedPrecondition(
              'App ' + number.ingressApp + " doesn't exist"
            )
          return [
            4 /*yield*/,
            redis.set(
              'extlink:' + number.getE164Number(),
              number.getIngressApp()
            )
          ]
        case 4:
          _a.sent()
          _a.label = 5
        case 5:
          return [
            4 /*yield*/,
            routr.resourceType('numbers').create(resource)
            // We do this to get updated metadata from Routr
          ]
        case 6:
          ref = _a.sent()
          return [4 /*yield*/, routr.resourceType('numbers').get(ref)]
        case 7:
          jsonObj = _a.sent()
          callback(null, numberDecoder(jsonObj))
          return [3 /*break*/, 9]
        case 8:
          err_1 = _a.sent()
          return [2 /*return*/, callback(err_1)]
        case 9:
          return [2 /*return*/]
      }
    })
  })
}
var getNumber = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var numberRef, jsonObj, err_2
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          numberRef = call.request.getRef()
          logger.info('verbose', '@yaps/core getNumber [ref ' + numberRef + ']')
          _a.label = 1
        case 1:
          _a.trys.push([1, 4, , 5])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          return [4 /*yield*/, routr.resourceType('numbers').get(numberRef)]
        case 3:
          jsonObj = _a.sent()
          callback(null, numberDecoder(jsonObj))
          return [3 /*break*/, 5]
        case 4:
          err_2 = _a.sent()
          return [2 /*return*/, callback(err_2)]
        case 5:
          return [2 /*return*/]
      }
    })
  })
}
var updateNumber = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var number, encoder, resource, ref, app, jsonObj, err_3
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          number = call.request.getNumber()
          logger.info(
            'verbose',
            '@yaps/core updateNumber [entity ' + number.getE164Number() + ']'
          )
          if (number.getAorLink() && number.getIngressApp()) {
            callback(
              new YAPSInvalidArgument(
                "'ingressApp' and 'aorLink' are not compatible parameters"
              )
            )
            return [2 /*return*/]
          } else if (!number.getAorLink() && !number.getIngressApp()) {
            callback(
              new YAPSInvalidArgument(
                "You must provider either an 'ingressApp' or and 'aorLink'"
              )
            )
            return [2 /*return*/]
          }
          encoder = new REncoder(
            Kind.NUMBER,
            number.getE164Number(),
            number.getRef()
          )
          if (number.getAorLink()) {
            encoder = encoder
              .withLocation(
                'tel:' + number.getE164Number(),
                number.getAorLink()
              )
              .withMetadata({
                gwRef: number.getProviderRef(),
                createdOn: number.getCreateTime(),
                modifiedOn: number.getUpdateTime()
              })
          } else {
            // TODO: Perhaps I should place this in a ENV
            encoder = encoders
              .withLocation(
                'tel:' + number.getE164Number(),
                'sip:ast@mediaserver'
              )
              .withMetadata({
                ingressApp: number.getIngressApp(),
                gwRef: number.getProviderRef(),
                createdOn: number.getCreateTime(),
                modifiedOn: number.getUpdateTime()
              })
          }
          resource = encoder.build()
          logger.log(
            'debug',
            '@yaps/core updateNumber [resource: ' +
              JSON.stringify(resource) +
              ']'
          )
          _a.label = 1
        case 1:
          _a.trys.push([1, 10, , 11])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          return [4 /*yield*/, routr.resourceType('numbers').update(resource)]
        case 3:
          ref = _a.sent()
          if (!number.getIngressApp()) return [3 /*break*/, 6]
          return [4 /*yield*/, redis.get(number.getIngressApp())]
        case 4:
          app = _a.sent()
          if (!app)
            throw new YAPSFailedPrecondition(
              'App ' + number.ingressApp + " doesn't exist"
            )
          return [
            4 /*yield*/,
            redis.set(
              'extlink:' + number.getE164Number(),
              number.getIngressApp()
            )
          ]
        case 5:
          _a.sent()
          return [3 /*break*/, 8]
        case 6:
          return [4 /*yield*/, redis.del('extlink:' + number.getE164Number())]
        case 7:
          _a.sent()
          _a.label = 8
        case 8:
          return [4 /*yield*/, routr.resourceType('numbers').get(ref)]
        case 9:
          jsonObj = _a.sent()
          callback(null, numberDecoder(jsonObj))
          return [3 /*break*/, 11]
        case 10:
          err_3 = _a.sent()
          return [2 /*return*/, callback(err_3)]
        case 11:
          return [2 /*return*/]
      }
    })
  })
}
var deleteNumber = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var numberRef, err_4
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          numberRef = call.request.getRef()
          logger.info(
            'verbose',
            '@yaps/core deleteNumber [ref ' + numberRef + ']'
          )
          _a.label = 1
        case 1:
          _a.trys.push([1, 4, , 5])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          return [4 /*yield*/, routr.resourceType('numbers').delete(numberRef)]
        case 3:
          _a.sent()
          callback(null, new Empty())
          return [3 /*break*/, 5]
        case 4:
          err_4 = _a.sent()
          return [2 /*return*/, callback(err_4)]
        case 5:
          return [2 /*return*/]
      }
    })
  })
}
var getIngressApp = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var e164number, appName, appFromDB, app
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          e164number = call.request.getE164Number()
          return [
            4 /*yield*/,
            redis.get('extlink:' + call.request.getE164Number())
          ]
        case 1:
          appName = _a.sent()
          logger.log(
            'debug',
            '@yaps/core getIngressApp [appName: ' + appName + ']'
          )
          return [4 /*yield*/, redis.get(appName)]
        case 2:
          appFromDB = _a.sent()
          if (!appFromDB) {
            callback(
              new YAPSError(
                grpc.status.NOT_FOUND,
                'App ' + appName + ' not found'
              )
            )
            return [2 /*return*/]
          }
          app = new AppManagerPB.App(JSON.parse(appFromDB).array)
          callback(null, app)
          return [2 /*return*/]
      }
    })
  })
}
module.exports.listNumbers = listNumbers
module.exports.createNumber = createNumber
module.exports.getNumber = getNumber
module.exports.deleteNumber = deleteNumber
module.exports.updateNumber = updateNumber
module.exports.getIngressApp = getIngressApp
//# sourceMappingURL=numbers_srv.js.map
