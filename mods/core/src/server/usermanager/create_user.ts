import redis from '../../common/redis'
import { App } from '../protos/appmanager_pb'
import { EventsSender } from '@fonos/events'
import logger from '@fonos/logger'

let events: any

try {
  if (!process.env.EVENTS_BROKERS)
    throw new Error(
      'core.common.events [environment variable EVENTS_BROKERS not set]'
    )
  const brokers = process.env.EVENTS_BROKERS.split(',')
  events = new EventsSender(brokers, 'APP_CREATED')
  events.connect()
} catch (e) {
  logger.error(e)
}

export default async function (app: App): Promise<App> {
  app.setStatus(App.Status.CREATING)
  app.setCreateTime(new Date().toString())
  app.setUpdateTime(new Date().toString())

  await redis.lrem('apps', 0, app.getName())
  await redis.lpush('apps', app.getName())
  // WARN: This feels very hacky but it works
  await redis.set(app.getName(), JSON.stringify(app.toObject()))
  await events.sendToQ({
    name: app.getName(),
    bucket: app.getBucket()
  })
  return app
}
