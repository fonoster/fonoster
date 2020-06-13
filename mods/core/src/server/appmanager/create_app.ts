import redis from '../../common/redis'
import { App } from '../protos/appmanager_pb'

export default async function (app: App): Promise<App> {
  app.setStatus(App.Status.CREATING)
  app.setCreateTime(new Date().toString())
  app.setUpdateTime(new Date().toString())

  await redis.lrem('apps', 0, app.getName())
  await redis.lpush('apps', app.getName())
  // WARN: This feels very hacky but it works
  await redis.set(app.getName(), JSON.stringify(app.toObject()))
  return app
}
