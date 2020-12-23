import redis from '../../common/redis'
import { App } from '../protos/appmanager_pb'
import { FonosError } from '@fonos/errors'
import jsonToApp from './json_to_app'

export default async function (name: string): Promise<App> {
  const jsonString = await redis.get(name)
  const app: App = jsonToApp(JSON.parse(jsonString))
  if (!jsonString || App.Status.REMOVED == app.getStatus())
    throw new FonosError(`App ${name} does not exist`)
  return jsonToApp(JSON.parse(jsonString))
}
