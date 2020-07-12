import redis from '../../common/redis'
import { App } from '../protos/appmanager_pb'
import jsonToApp from './json_to_app'

export default async function (page: number, pageSize: number) {
  if (!page) return {}

  pageSize--
  let pageToken = page + pageSize
  const appsNames = await redis.lrange('apps', page, pageToken++)
  const apps: App[] = []

  for (const idx in appsNames) {
    const jsonString = await redis.get(appsNames[idx])
    apps.push(jsonToApp(JSON.parse(jsonString)))
  }

  return {
    apps,
    pageToken
  }
}
