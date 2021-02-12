import jsonParser from './json_parser'
import { User } from '../protos/usermanager_pb'
import { userOperation } from './src/operations/UserOperation'
import { use } from 'chai'
import { User as USR } from './src/models/user'

export default async function (email: string) {
  const result = await userOperation.getUserByEmail(email.toString())
  result.status = User.Status.SUSPENDED.toString()
  await userOperation.updateUser(result.email.toString(), result.status)
  return 'completed!'
}
