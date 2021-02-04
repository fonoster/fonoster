import redis from '../../common/redis'
import { App } from '../protos/appmanager_pb'
import jsonToApp from './json_to_app'

export default async function (pageToken: number, pageSize: number) {
  if (!pageToken) return {}
  pageToken--
  pageSize--

  let upperRange = pageToken + pageSize

  const appsNames = await redis.lrange('apps', pageToken, upperRange)
  const apps: App[] = []

  for (const idx in appsNames) {
    const jsonString = await redis.get(appsNames[idx])
    const app: App = jsonToApp(JSON.parse(jsonString))
    if (App.Status.REMOVED != app.getStatus())
      apps.push(jsonToApp(JSON.parse(jsonString)))
  }

  upperRange++

  return {
    apps,
    pageToken: upperRange
  }
}
