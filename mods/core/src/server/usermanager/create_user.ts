//import redis from '../../common/redis'
import { User } from '../protos/usermanager_pb'
import { userOperation } from './src/operations/UserOperation'
import jsonParse from './json_parser'

export default async function (user: User): Promise<User> {
  user.setFirstname(user.getFirstname())
  user.setLastname(user.getLastname())
  user.setUsername(user.getUsername())
  user.setEmail(user.getEmail())
  user.setPassword(user.getPassword())
  user.setRoles(user.getRoles())
  user.setStatus(User.Status.ACTIVE)
  user.setCreateTime(new Date().toString())
  user.setUpdateTime(new Date().toString())
  await userOperation.saveUser(user.toObject())
  console.log(user)
  return user
}
