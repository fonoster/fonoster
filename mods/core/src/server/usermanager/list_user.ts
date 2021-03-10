import UserOperation from './src/operations/user_operations'
import { User } from '../protos/usermanager_pb'
import jsonParse from './json_parser'

export default async function (pageToken: number, pageSize: number) {
  let userOperation = new UserOperation();
  
  if (!pageToken) return {}
  pageToken--
  pageSize--

  let upperRange = pageToken + pageSize

  const userMails = await userOperation.getUsers()
  const users: User[] = []

  for (const idx in userMails) {
    let usrMail = userMails[idx].email

    const jsonString = await userOperation.getUserByEmail(usrMail)
    const user: User = jsonParse(jsonString)

    if (User.Status.DELETED != user.getStatus())
      users.push(jsonParse(jsonString))
  }

  upperRange++

  return {
    users,
    pageToken: upperRange
  }
}
