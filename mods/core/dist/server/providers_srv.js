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
var YAPSAuthError = require('@yaps/errors').YAPSAuthError
var AppManagerPB = require('./protos/appmanager_pb')
var routr = require('./routr')
var redis = require('./redis')
var grpc = require('grpc')
var logger = require('../common/logger')
var providerDecoder = require('../common/decoders/provider_decoder')
var Empty = require('./protos/common_pb').Empty
var ListProvidersResponse = require('./protos/providers_pb')
  .ListProvidersResponse
var _a = require('../common/resource_encoder'),
  REncoder = _a.REncoder,
  Kind = _a.Kind
var auth = require('../common/trust_util').auth
var listProviders = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var page, itemsPerPage, result, providers, response, jsonObj, provider
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          if (!call.request.getPageToken()) {
            // Nothing to send
            callback(null, new ListProvidersResponse())
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
              .resourceType('gateways')
              .list({ page: page, itemsPerPage: itemsPerPage })
          ]
        case 2:
          result = _a.sent()
          providers = result.data
          response = new ListProvidersResponse()
          for (i = 0; i < providers.length; i++) {
            jsonObj = providers[i]
            provider = providerDecoder(jsonObj)
            response.addProviders(provider)
          }
          if (providers.length > 0) response.setNextPageToken('' + (page + 1))
          callback(null, response)
          return [2 /*return*/]
      }
    })
  })
}
var createProvider = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var provider, encoder, resource, ref, jsonObj, err_1
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          provider = call.request.getProvider()
          logger.info(
            'verbose',
            '@yaps/core createProvider [entity ' + provider.getName() + ']'
          )
          encoder = new REncoder(Kind.GATEWAY, provider.getName())
            .withCredentials(provider.getUsername(), provider.getSecret())
            .withHost(provider.getHost())
            .withTransport(provider.getTransport())
            .withExpires(provider.getExpires())
          resource = encoder.build()
          logger.log(
            'debug',
            '@yaps/core createProvider [resource: ' +
              JSON.stringify(resource) +
              ']'
          )
          _a.label = 1
        case 1:
          _a.trys.push([1, 5, , 6])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          return [
            4 /*yield*/,
            routr.resourceType('gateways').create(resource)
            // We do this to get updated metadata from Routr
          ]
        case 3:
          ref = _a.sent()
          return [4 /*yield*/, routr.resourceType('gateways').get(ref)]
        case 4:
          jsonObj = _a.sent()
          callback(null, providerDecoder(jsonObj))
          return [3 /*break*/, 6]
        case 5:
          err_1 = _a.sent()
          return [2 /*return*/, callback(err_1)]
        case 6:
          return [2 /*return*/]
      }
    })
  })
}
var getProvider = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var providerRef, jsonObj, err_2
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          providerRef = call.request.getRef()
          logger.info(
            'verbose',
            '@yaps/core getProvider [ref ' + providerRef + ']'
          )
          _a.label = 1
        case 1:
          _a.trys.push([1, 4, , 5])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          return [4 /*yield*/, routr.resourceType('gateways').get(providerRef)]
        case 3:
          jsonObj = _a.sent()
          callback(null, providerDecoder(jsonObj))
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
var updateProvider = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var provider, encoder, resource, ref, jsonObj, err_3
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          provider = call.request.getProvider()
          logger.info(
            'verbose',
            '@yaps/core updateProvider [entity ' + provider.getName() + ']'
          )
          encoder = new REncoder(
            Kind.GATEWAY,
            provider.getName(),
            provider.getRef()
          )
            .withMetadata({
              createdOn: provider.getCreateTime(),
              modifiedOn: provider.getUpdateTime()
            })
            .withCredentials(provider.getUsername(), provider.getSecret())
            .withHost(provider.getHost())
            .withTransport(provider.getTransport())
            .withExpires(provider.getExpires())
          resource = encoder.build()
          logger.log(
            'debug',
            '@yaps/core updateProvider [resource: ' +
              JSON.stringify(resource) +
              ']'
          )
          _a.label = 1
        case 1:
          _a.trys.push([1, 5, , 6])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          return [
            4 /*yield*/,
            routr.resourceType('gateways').update(resource)
            // We do this to get updated metadata from Routr
          ]
        case 3:
          ref = _a.sent()
          return [4 /*yield*/, routr.resourceType('gateways').get(ref)]
        case 4:
          jsonObj = _a.sent()
          callback(null, providerDecoder(jsonObj))
          return [3 /*break*/, 6]
        case 5:
          err_3 = _a.sent()
          return [2 /*return*/, callback(err_3)]
        case 6:
          return [2 /*return*/]
      }
    })
  })
}
var deleteProvider = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var providerRef, err_4
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          providerRef = call.request.getRef()
          logger.info(
            'verbose',
            '@yaps/core deleteProvider [ref ' + providerRef + ']'
          )
          _a.label = 1
        case 1:
          _a.trys.push([1, 4, , 5])
          return [4 /*yield*/, routr.connect()]
        case 2:
          _a.sent()
          return [
            4 /*yield*/,
            routr.resourceType('gateways').delete(providerRef)
          ]
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
module.exports.listProviders = listProviders
module.exports.createProvider = createProvider
module.exports.getProvider = getProvider
module.exports.deleteProvider = deleteProvider
module.exports.updateProvider = updateProvider
//# sourceMappingURL=providers_srv.js.map
