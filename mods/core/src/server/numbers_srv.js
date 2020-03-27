const NumbersPB = require('./protos/numbers_pb')
const AppManagerPB = require('./protos/appmanager_pb')
const { auth } = require('../common/trust_util')
const { YAPSError, YAPSAuthError } = require('../common/yaps_errors')
const grpc = require('grpc')
const redis = require('./redis')
const logger = require('../common/logger')

const createNumber = async (call, callback) => {
  if (!auth(call)) return callback(new YAPSAuthError())

  const number = call.request.getNumber()
  number.setCreateTime(new Date())
  number.setUpdateTime(new Date())

  await redis.call('sadd', 'numbers', number.getE164Number())
  await redis.call('set', number.getE164Number(), `${JSON.stringify(number)}`) // This feels very hacky
  await redis.call(
    'set',
    `extlink:${number.getE164Number()}`,
    number.getIngressApp()
  )

  callback(null, number)
}

const getIngressApp = async (call, callback) => {
  if (!auth(call)) return callback(new YAPSAuthError())

  const e164number = call.request.getE164Number()
  const appName = await redis.call(
    'get',
    `extlink:${call.request.getE164Number()}`
  )

  logger.log('debug', `@yaps/core getIngressApp [appName: ${appName}]`)

  const appFromDB = await redis.call('get', appName)

  if (!appFromDB) {
    callback(new YAPSError(grpc.status.NOT_FOUND, `App ${appName} not found`))
    return
  }

  const app = new AppManagerPB.App(JSON.parse(appFromDB).array)
  callback(null, app)
}

module.exports.createNumber = createNumber
module.exports.getIngressApp = getIngressApp
