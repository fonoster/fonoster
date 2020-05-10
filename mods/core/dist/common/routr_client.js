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
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
/**
 * Oversimplified version of a Routr API Client
 */
var RoutrClient = /** @class */ (function () {
  function RoutrClient (apiUrl, username, secret) {
    this.axios = require('axios')
    this.logger = require('./logger')
    this.handleError = require('./routr_errors')
    this.logger.log('debug', '@yaps/core RoutrClient [creating instance]')
    this.logger.log('debug', '@yaps/core RoutrClient [apiUrl: ' + apiUrl + ']')
    this.apiUrl = apiUrl
    this.username = username
    this.secret = secret
  }
  RoutrClient.prototype.connect = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _a
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            this.logger.log('debug', '@yaps/core RoutrClient [connecting]')
            _a = this
            return [4 /*yield*/, this.getToken(this.username, this.secret)]
          case 1:
            _a.token = _b.sent()
            this.logger.log(
              'debug',
              '@yaps/core RoutrClient [token: ' + this.token + ']'
            )
            return [2 /*return*/]
        }
      })
    })
  }
  RoutrClient.prototype.resourceType = function (resource) {
    this.resource = resource
    return this
  }
  RoutrClient.prototype.getToken = function (username, password) {
    return __awaiter(this, void 0, void 0, function () {
      var btoa, response, err_1
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            btoa = require('btoa')
            _a.label = 1
          case 1:
            _a.trys.push([1, 3, , 4])
            return [
              4 /*yield*/,
              this.axios
                .create({
                  baseURL: this.apiUrl + '/token',
                  headers: {
                    Authorization: 'Basic ' + btoa(username + ':' + password)
                  }
                })
                .get()
            ]
          case 2:
            response = _a.sent()
            return [2 /*return*/, response.data.data]
          case 3:
            err_1 = _a.sent()
            this.handleError(err_1)
            return [3 /*break*/, 4]
          case 4:
            return [2 /*return*/]
        }
      })
    })
  }
  RoutrClient.prototype.list = function (params) {
    if (params === void 0) {
      params = {}
    }
    return __awaiter(this, void 0, void 0, function () {
      var queryParams, url, response, err_2
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            queryParams = function (p) {
              return Object.keys(p).map(function (k) {
                return k + '=' + p[k]
              })
            }
            _a.label = 1
          case 1:
            _a.trys.push([1, 3, , 4])
            url =
              this.apiUrl +
              '/' +
              this.resource +
              '?token=' +
              this.token +
              '&filter=*&' +
              queryParams(params).join('&')
            return [4 /*yield*/, this.axios.get(url)]
          case 2:
            response = _a.sent()
            return [2 /*return*/, response.data]
          case 3:
            err_2 = _a.sent()
            this.handleError(err_2)
            return [3 /*break*/, 4]
          case 4:
            return [2 /*return*/]
        }
      })
    })
  }
  RoutrClient.prototype.get = function (ref) {
    return __awaiter(this, void 0, void 0, function () {
      var response, err_3
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            ref = ref ? '/' + ref : ''
            _a.label = 1
          case 1:
            _a.trys.push([1, 3, , 4])
            return [
              4 /*yield*/,
              this.axios.get(
                this.apiUrl + '/' + this.resource + ref + '?token=' + this.token
              )
            ]
          case 2:
            response = _a.sent()
            return [2 /*return*/, response.data.data]
          case 3:
            err_3 = _a.sent()
            this.handleError(err_3)
            return [3 /*break*/, 4]
          case 4:
            return [2 /*return*/]
        }
      })
    })
  }
  RoutrClient.prototype.delete = function (ref) {
    return __awaiter(this, void 0, void 0, function () {
      var err_4
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            ref = ref ? '/' + ref : ''
            _a.label = 1
          case 1:
            _a.trys.push([1, 3, , 4])
            return [
              4 /*yield*/,
              this.axios.delete(
                this.apiUrl + '/' + this.resource + ref + '?token=' + this.token
              )
            ]
          case 2:
            return [2 /*return*/, _a.sent()]
          case 3:
            err_4 = _a.sent()
            this.handleError(err_4)
            return [3 /*break*/, 4]
          case 4:
            return [2 /*return*/]
        }
      })
    })
  }
  RoutrClient.prototype.create = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      var response, err_5
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3])
            return [
              4 /*yield*/,
              this.axios.post(
                this.apiUrl + '/' + this.resource + '?token=' + this.token,
                data
              )
            ]
          case 1:
            response = _a.sent()
            return [2 /*return*/, response.data.data]
          case 2:
            err_5 = _a.sent()
            this.handleError(err_5)
            return [3 /*break*/, 3]
          case 3:
            return [2 /*return*/]
        }
      })
    })
  }
  RoutrClient.prototype.update = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      var ref, response, err_6
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3])
            ref = data.metadata.ref
            return [
              4 /*yield*/,
              this.axios.put(
                this.apiUrl +
                  '/' +
                  this.resource +
                  '/' +
                  ref +
                  '?token=' +
                  this.token,
                data
              )
            ]
          case 1:
            response = _a.sent()
            return [2 /*return*/, response.data.data]
          case 2:
            err_6 = _a.sent()
            this.handleError(err_6)
            return [3 /*break*/, 3]
          case 3:
            return [2 /*return*/]
        }
      })
    })
  }
  return RoutrClient
})()
module.exports = RoutrClient
//# sourceMappingURL=routr_client.js.map
