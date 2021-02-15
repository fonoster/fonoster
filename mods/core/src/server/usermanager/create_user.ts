//import redis from '../../common/redis'
import { User } from '../protos/usermanager_pb'
import { userOperation } from './src/operations/user_operations'

export default async function (user: User): Promise<User> {
  user.setStatus(User.Status.ACTIVE)
  user.setRole("REGULAR_USER")
  user.setCreateTime(new Date().toString())
  user.setUpdateTime(new Date().toString())
  await userOperation.saveUser(user.toObject())
  return user
}
