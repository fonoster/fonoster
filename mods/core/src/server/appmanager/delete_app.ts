import redis from '../../common/redis'
import { FonosError } from '@fonos/errors'
import jsonToApp from './json_to_app'
import { App } from '../protos/appmanager_pb'
import { EventsSender } from '@fonos/events'
import logger from '@fonos/logger'

let events: any

try {
  if (!process.env.EVENTS_BROKERS)
    throw 'core.common.events [environment variable EVENTS_BROKERS not set]'
  const brokers = process.env.EVENTS_BROKERS.split(',')
  events = new EventsSender(brokers, 'APP_REMOVED')
  events.connect()
} catch (e) {
  logger.error(e)
}

export default async function (name: string) {
  const result = await redis.get(name)
  if (!result) throw new FonosError(`App ${name} does not exist`)
  const app: App = jsonToApp(JSON.parse(result))
  app.setName(app.getName())
  app.setDescription(app.getDescription())
  app.setCreateTime(app.getCreateTime())
  app.setUpdateTime(app.getUpdateTime())
  app.setStatus(App.Status.REMOVED)
  app.setBucket(app.getBucket())
  await redis.set(app.getName(), JSON.stringify(app.toObject()))
  await events.sendToQ({
    name: app.getName(),
    bucket: app.getBucket()
  })
}
