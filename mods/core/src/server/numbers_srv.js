const NumbersPB = require('./protos/numbers_pb')
const AppManagerPB = require('./protos/appmanager_pb')
const { auth } = require('../common/trust_util')
const redis = require('./redis')
const logger = require('../common/logger')

const createNumber = async (call, callback) => {
  try {
    auth(call)
  } catch (e) {
    callback(new Error('UNAUTHENTICATED'), null)
    return
  }

  // TODO: Need request validation

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
  try {
    auth(call)
  } catch (e) {
    callback(new Error('UNAUTHENTICATED'), null)
    return
  }

  // TODO: Need request validation
  const e164number = call.request.getE164Number()
  const appName = await redis.call(
    'get',
    `extlink:${call.request.getE164Number()}`
  )

  logger.log('debug', `@yaps/core getIngressApp [appName: ${appName}]`)

  // TODO: throw error if appName is null
  const appFromDB = await redis.call('get', appName)

  if (!appFromDB) {
    callback(new Error('NOT_FOUND'))
    return
  }

  const app = new AppManagerPB.App(JSON.parse(appFromDB).array)
  callback(null, app)
}

module.exports.createNumber = createNumber
module.exports.getIngressApp = getIngressApp
