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
const axios = require('axios')
const logger = require('./logger')
const btoa = require('btoa')
const handleError = require('./routr_errors')
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
/**
 * Oversimplified version of a Routr API Client
 */
class RoutrClient {
  constructor (apiUrl, username, secret) {
    logger.log('debug', `@yaps/core RoutrClient [creating instance]`)
    logger.log('debug', `@yaps/core RoutrClient [apiUrl: ${apiUrl}]`)
    this.apiUrl = apiUrl
    this.username = username
    this.secret = secret
  }
  connect () {
    return __awaiter(this, void 0, void 0, function * () {
      logger.log('debug', `@yaps/core RoutrClient [connecting]`)
      this.token = yield this.getToken(this.username, this.secret)
      logger.log('debug', `@yaps/core RoutrClient [token: ${this.token}]`)
    })
  }
  resourceType (resource) {
    this.resource = resource
    return this
  }
  getToken (username, password) {
    return __awaiter(this, void 0, void 0, function * () {
      try {
        const response = yield axios
          .create({
            baseURL: `${this.apiUrl}/token`,
            headers: {
              Authorization: `Basic ${btoa(username + ':' + password)}`
            }
          })
          .get()
        return response.data.data
      } catch (err) {
        handleError(err)
      }
    })
  }
  list (params) {
    return __awaiter(this, void 0, void 0, function * () {
      const queryParams = p => Object.keys(p).map(k => `${k}=${p[k]}`)
      try {
        const url = `${this.apiUrl}/${this.resource}?token=${
          this.token
        }&filter=*&${queryParams(params).join('&')}`
        const response = yield axios.get(url)
        return response.data
      } catch (err) {
        handleError(err)
      }
    })
  }
  get (ref) {
    return __awaiter(this, void 0, void 0, function * () {
      ref = ref ? `/${ref}` : ''
      try {
        const response = yield axios.get(
          `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
        )
        return response.data.data
      } catch (err) {
        handleError(err)
      }
    })
  }
  delete (ref) {
    return __awaiter(this, void 0, void 0, function * () {
      ref = ref ? `/${ref}` : ''
      try {
        return yield axios.delete(
          `${this.apiUrl}/${this.resource}${ref}?token=${this.token}`
        )
      } catch (err) {
        handleError(err)
      }
    })
  }
  create (data) {
    return __awaiter(this, void 0, void 0, function * () {
      try {
        const response = yield axios.post(
          `${this.apiUrl}/${this.resource}?token=${this.token}`,
          data
        )
        return response.data.data
      } catch (err) {
        handleError(err)
      }
    })
  }
  update (data) {
    return __awaiter(this, void 0, void 0, function * () {
      try {
        const ref = data.metadata.ref
        const response = yield axios.put(
          `${this.apiUrl}/${this.resource}/${ref}?token=${this.token}`,
          data
        )
        return response.data.data
      } catch (err) {
        handleError(err)
      }
    })
  }
}
module.exports = RoutrClient
//# sourceMappingURL=routr_client.js.map
