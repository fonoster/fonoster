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
const { YAPSError, YAPSAuthError } = require('@yaps/errors')
const { ListAppsResponse, App } = require('./protos/appmanager_pb')
const { Empty } = require('./protos/common_pb')
const { auth } = require('../common/trust_util')
const logger = require('../common/logger')
const redis = require('./redis')
const objectid = require('objectid')
const appmanager = require('../schemas/appmanager.schema')
const updateBucketPolicy = require('../common/fsutils')
const Status = require('grpc').status
const listApps = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    if (!call.request.getPageToken()) {
      // Nothing to send
      callback(null, new ListAppsResponse())
      return
    }
    const pageToken = parseInt(call.request.getPageToken())
    const pageSize = call.request.getPageSize() - 1
    const upperRange = pageToken + pageSize
    const apps = yield redis.lrange('apps', pageToken, upperRange)
    const response = new ListAppsResponse()
    for (const jsonObj in apps) {
      const app = new App(JSON.parse(jsonObj).array)
      response.addApps(app)
    }
    if (apps.length > 0) response.setNextPageToken('' + upperRange)
    callback(null, response)
  })
const getApp = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    const result = yield redis.call('get', call.request.getName())
    if (!result) {
      callback(
        new YAPSError(
          Status.NOT_FOUND,
          `App ${call.request.getName()} does not exist`
        )
      )
      return
    }
    const app = new App(JSON.parse(result).array)
    callback(null, app)
  })
const createApp = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    logger.log('debug', `@yaps/core createApp`)
    const errors = appmanager.createAppRequest.validate({
      app: {
        name: call.request.getApp().getName(),
        description: call.request.getApp().getDescription()
      }
    })
    if (errors.length > 0) {
      //callback(new YAPSInvalidArgument(errors[0].message))
      return
    }
    const app = call.request.getApp()
    app.setStatus(App.Status.CREATING)
    app.setCreateTime(new Date())
    app.setUpdateTime(new Date())
    yield redis.lrem('apps', 0, app.getName())
    yield redis.lpush('apps', app.getName())
    // This feels very hacky but it works for now
    yield redis.set(app.getName(), `${JSON.stringify(app)}`)
    logger.log(
      'debug',
      `@yaps/core createApp [updating bucket policy for app: ${app.getName()}]`
    )
    yield updateBucketPolicy(app.getBucket() || 'default')
    callback(null, app)
  })
// Not yet implemented
const updateApp = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    console.log(`updating app: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
  })
const deleteApp = (call, callback) =>
  __awaiter(void 0, void 0, void 0, function * () {
    if (!auth(call)) return callback(new YAPSAuthError())
    const result = yield redis.call('get', call.request.getName())
    if (!result) {
      callback(
        new YAPSError(
          Status.NOT_FOUND,
          `App ${call.request.getName()} does not exist`
        )
      )
      return
    }
    yield redis.call('lrem', 'apps', '0', call.request.getName())
    yield redis.call('del', call.request.getName())
    // TODO: We should also remove the extlink if it exist
    callback(null, new Empty())
  })
module.exports.listApps = listApps
module.exports.getApp = getApp
module.exports.createApp = createApp
module.exports.updateApp = updateApp
module.exports.deleteApp = deleteApp
//# sourceMappingURL=appmanager_srv.js.map
