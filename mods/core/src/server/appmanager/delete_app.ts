import redis from '../../common/redis'
import { FonosError } from '@fonos/errors'

export default async function (name: string) {
  const result = await redis.get(name)
  if (!result) throw new FonosError(`App ${name} does not exist`)
  await redis.lrem('apps', 0, name)
  await redis.del(name)
}
