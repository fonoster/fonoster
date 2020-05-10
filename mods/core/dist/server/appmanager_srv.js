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
var YAPSError = require('@yaps/errors')
var _a = require('@yaps/errors'),
  YAPSInvalidArgument = _a.YAPSInvalidArgument,
  YAPSAuthError = _a.YAPSAuthError
var _b = require('./protos/appmanager_pb'),
  ListAppsResponse = _b.ListAppsResponse,
  App = _b.App
var Empty = require('./protos/common_pb').Empty
var auth = require('../common/trust_util').auth
var logger = require('../common/logger')
var redis = require('./redis')
var objectid = require('objectid')
var appmanager = require('../schemas/appmanager.schema')
var updateBucketPolicy = require('../common/fsutils')
var Status = require('grpc').status
var listApps = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var pageToken, pageSize, upperRange, apps, response, jsonObj, app
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          if (!call.request.getPageToken()) {
            // Nothing to send
            callback(null, new ListAppsResponse())
            return [2 /*return*/]
          }
          pageToken = parseInt(call.request.getPageToken())
          pageSize = call.request.getPageSize() - 1
          upperRange = pageToken + pageSize
          return [4 /*yield*/, redis.lrange('apps', pageToken, upperRange)]
        case 1:
          apps = _a.sent()
          response = new ListAppsResponse()
          i = 0
          _a.label = 2
        case 2:
          if (!(i < apps.length)) return [3 /*break*/, 5]
          return [4 /*yield*/, redis.get(apps[i])]
        case 3:
          jsonObj = _a.sent()
          app = new App(JSON.parse(jsonObj).array)
          response.addApps(app)
          _a.label = 4
        case 4:
          i++
          return [3 /*break*/, 2]
        case 5:
          if (apps.length > 0) response.setNextPageToken('' + upperRange)
          callback(null, response)
          return [2 /*return*/]
      }
    })
  })
}
var getApp = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var result, app
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          return [4 /*yield*/, redis.call('get', call.request.getName())]
        case 1:
          result = _a.sent()
          if (!result) {
            callback(
              new YAPSError(
                Status.NOT_FOUND,
                'App ' + call.request.getName() + ' does not exist'
              )
            )
            return [2 /*return*/]
          }
          app = new App(JSON.parse(result).array)
          callback(null, app)
          return [2 /*return*/]
      }
    })
  })
}
var createApp = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var errors, app
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          logger.log('debug', '@yaps/core createApp')
          errors = appmanager.createAppRequest.validate({
            app: {
              name: call.request.getApp().getName(),
              description: call.request.getApp().getDescription()
            }
          })
          if (errors.length > 0) {
            //callback(new YAPSInvalidArgument(errors[0].message))
            return [2 /*return*/]
          }
          app = call.request.getApp()
          app.setStatus(App.Status.CREATING)
          app.setCreateTime(new Date())
          app.setUpdateTime(new Date())
          return [4 /*yield*/, redis.lrem('apps', 0, app.getName())]
        case 1:
          _a.sent()
          return [
            4 /*yield*/,
            redis.lpush('apps', app.getName())
            // This feels very hacky but it works for now
          ]
        case 2:
          _a.sent()
          // This feels very hacky but it works for now
          return [
            4 /*yield*/,
            redis.set(app.getName(), '' + JSON.stringify(app))
          ]
        case 3:
          // This feels very hacky but it works for now
          _a.sent()
          logger.log(
            'debug',
            '@yaps/core createApp [updating bucket policy for app: ' +
              app.getName() +
              ']'
          )
          return [4 /*yield*/, updateBucketPolicy(app.getBucket() || 'default')]
        case 4:
          _a.sent()
          callback(null, app)
          return [2 /*return*/]
      }
    })
  })
}
// Not yet implemented
var updateApp = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
      console.log('updating app: ' + JSON.stringify(call.request))
      // -- Operate here
      // ---
      callback(null, call.request.app)
      return [2 /*return*/]
    })
  })
}
var deleteApp = function (call, callback) {
  return __awaiter(_this, void 0, void 0, function () {
    var result
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!auth(call)) return [2 /*return*/, callback(new YAPSAuthError())]
          return [4 /*yield*/, redis.call('get', call.request.getName())]
        case 1:
          result = _a.sent()
          if (!result) {
            callback(
              new YAPSError(
                Status.NOT_FOUND,
                'App ' + call.request.getName() + ' does not exist'
              )
            )
            return [2 /*return*/]
          }
          return [
            4 /*yield*/,
            redis.call('lrem', 'apps', '0', call.request.getName())
          ]
        case 2:
          _a.sent()
          return [
            4 /*yield*/,
            redis.call('del', call.request.getName())
            // TODO: We should also remove the extlink if it exist
          ]
        case 3:
          _a.sent()
          // TODO: We should also remove the extlink if it exist
          callback(null, new Empty())
          return [2 /*return*/]
      }
    })
  })
}
module.exports.listApps = listApps
module.exports.getApp = getApp
module.exports.createApp = createApp
module.exports.updateApp = updateApp
module.exports.deleteApp = deleteApp
//# sourceMappingURL=appmanager_srv.js.map
