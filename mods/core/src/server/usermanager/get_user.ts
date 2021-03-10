import { User } from '../protos/usermanager_pb'
import jsonParser from './json_parser'
import UserOperation from './src/operations/user_operations'

export default async function (email: string): Promise<User> {
  let userOperation = new UserOperation();
  const jsonString = await userOperation.getUserByEmail(email)
  const user: User = jsonParser(jsonString)
  return jsonParser(jsonString)
}
