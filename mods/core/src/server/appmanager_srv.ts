export {};

const { 
  FonosError, 
  FonosAuthError } = require('@fonos/errors')
const { ListAppsResponse, App } = require('./protos/appmanager_pb')
const { Empty } = require('./protos/common_pb')
const { auth } = require('../common/trust_util')
const logger = require('../common/logger')
const redis = require('./redis')
const objectid = require('objectid')
const appmanager = require('../schemas/appmanager.schema')
const updateBucketPolicy = require('../common/fsutils')
const Status = require('grpc').status

const listApps = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  if (!call.request.getPageToken()) {
    // Nothing to send
    callback(null, new ListAppsResponse())
    return
  }

  const pageToken = parseInt(call.request.getPageToken())
  const pageSize = call.request.getPageSize() - 1
  const upperRange = pageToken + pageSize
  const apps = await redis.lrange('apps', pageToken, upperRange)
  const response = new ListAppsResponse()

  for (const jsonObj in apps) {
    const app = new App(JSON.parse(jsonObj).array)
    response.addApps(app)
  }

  if (apps.length > 0) response.setNextPageToken('' + upperRange)

  callback(null, response)
}

const getApp = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const result = await redis.call('get', call.request.getName())

  if (!result) {
    callback(
      new FonosError(
        Status.NOT_FOUND,
        `App ${call.request.getName()} does not exist`
      )
    )
    return
  }

  const app = new App(JSON.parse(result).array)
  callback(null, app)
}

const createApp = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  logger.log('debug', `@fonos/core createApp`)

  const errors = appmanager.createAppRequest.validate({
    app: {
      name: call.request.getApp().getName(),
      description: call.request.getApp().getDescription()
    }
  })

  if (errors.length > 0) {
    //callback(new FonosInvalidArgument(errors[0].message))
    return
  }

  const app = call.request.getApp()
  app.setStatus(App.Status.CREATING)
  app.setCreateTime(new Date())
  app.setUpdateTime(new Date())

  await redis.lrem('apps', 0, app.getName())
  await redis.lpush('apps', app.getName())
  // This feels very hacky but it works for now
  await redis.set(app.getName(), `${JSON.stringify(app)}`)

  logger.log(
    'debug',
    `@fonos/core createApp [updating bucket policy for app: ${app.getName()}]`
  )

  await updateBucketPolicy(app.getBucket() || 'default')

  callback(null, app)
}

// Not yet implemented
const updateApp = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())
  console.log(`updating app: ${JSON.stringify(call.request)}`)
  // -- Operate here
  // ---
  callback(null, call.request.app)
}

const deleteApp = async (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())

  const result = await redis.call('get', call.request.getName())

  if (!result) {
    callback(
      new FonosError(
        Status.NOT_FOUND,
        `App ${call.request.getName()} does not exist`
      )
    )
    return
  }

  await redis.call('lrem', 'apps', '0', call.request.getName())
  await redis.call('del', call.request.getName())

  // TODO: We should also remove the extlink if it exist
  callback(null, new Empty())
}

module.exports.listApps = listApps
module.exports.getApp = getApp
module.exports.createApp = createApp
module.exports.updateApp = updateApp
module.exports.deleteApp = deleteApp
