//import redis from '../../common/redis'
import { User } from '../protos/usermanager_pb'
import { userOperation } from './src/operations/user_operations'
import { nanoid } from 'nanoid'

export default async function (user: User): Promise<User> {
  user.setAccessKeyId(nanoid(20))
  user.setStatus(User.Status.ACTIVE)
  user.setRole("USER")
  user.setCreateTime(new Date().toString())
  user.setUpdateTime(new Date().toString())
  await userOperation.saveUser(user.toObject())
  return user
}
