import { FonosError, FonosAuthError } from '@fonos/errors'
import redis from '../../common/redis'
import grpc from 'grpc'
import logger from '@fonos/logger'
import { auth } from '../../common/trust_util'

export default async function getIngressApp (call: any, callback: any) {
  if (!auth(call)) return callback(new FonosAuthError())

  const e164number = call.request.getE164Number()
  const appName = await redis.get(`extlink:${call.request.getE164Number()}`)

  logger.log('debug', `@fonos/core getIngressApp [appName: ${appName}]`)

  const appFromDB = await redis.get(appName)

  if (!appFromDB) {
    callback(new FonosError(`App ${appName} not found`, grpc.status.NOT_FOUND))
    return
  }

  //const app = new AppManagerPB.App(JSON.parse(appFromDB).array)
  //callback(null, app)
}
