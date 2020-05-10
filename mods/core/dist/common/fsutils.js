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
const { fsInstance } = require('./utils')
const policy = require('./bucket_policy')
const logger = require('./logger')
module.exports = bucket =>
  __awaiter(void 0, void 0, void 0, function * () {
    try {
      const fsConn = fsInstance()
      const exists = yield fsConn.bucketExists(bucket)
      if (!exists) {
        logger.log(
          'verbose',
          `@yaps/core fsutils [Creating storage and setting policy bucket: ${bucket}]`
        )
        yield fsConn.makeBucket(bucket, 'us-west-1')
        yield fsConn.setBucketPolicy(bucket, policy(bucket))
      }
    } catch (err) {
      throw err
    }
  })
//# sourceMappingURL=fsutils.js.map
