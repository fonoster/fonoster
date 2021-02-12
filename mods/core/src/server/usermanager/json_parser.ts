import { User } from '../protos/usermanager_pb'

export default function (jsonObj: any): User {
  const user = new User()
  user.setFirstname(jsonObj.firstname)
  user.setLastname(jsonObj.lastname)
  user.setUsername(jsonObj.username)
  user.setEmail(jsonObj.email)
  user.setRole(jsonObj.role)
  user.setAccessKeyId(jsonObj.accessKeyId)
  user.setStatus(jsonObj.status)
  user.setCreateTime(jsonObj.createTime)
  user.setUpdateTime(jsonObj.updateTime)
  return user
}
