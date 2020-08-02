import { FonosError } from '@fonos/errors'
import redis from '../../common/redis'
import grpc from 'grpc'
import logger from '@fonos/logger'
import jsonToApp from '../appmanager/json_to_app'
import { App } from '../protos/appmanager_pb'

export default async function (e164Number: string): Promise<App> {
  const appName = await redis.get(`extlink:${e164Number}`)

  logger.log('debug', `@fonos/core getIngressApp [appName: ${appName}]`)

  const appFromDB = await redis.get(appName)

  if (!appFromDB) {
    throw new FonosError(`App ${appName} not found`, grpc.status.NOT_FOUND)
  }

  return jsonToApp(JSON.parse(appFromDB))
}
