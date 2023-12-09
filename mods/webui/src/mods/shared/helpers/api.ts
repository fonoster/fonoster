import Fonoster from '@fonoster/sdk'
import { UpdateUserRequest } from '@fonoster/users/dist/client/types'

// Will take the credentials and API endpoint from the environment
const users = new Fonoster.Users()
const auth = new Fonoster.Auth()

/**
 * @deprecated These hacks should be replaced by the API
 */
export async function createUser(user) {
  try {
    return await users.createUser(user)
  } catch (e) {
    console.log(e)
  }
}

/**
 * @deprecated These hacks should be replaced by the API
 */
export async function getUser(email) {
  // TODO: Fix not using email as a filter
  const results = await users.listUsers({})

  return results.users.find(user => user.email === email)
}

/**
 * @deprecated These hacks should be replaced by the API
 */
export async function createToken(accessKeyId) {
  if (!accessKeyId) throw new Error('Missing param - accessKeyId')

  const response = await auth.createToken({
    accessKeyId: accessKeyId,
    roleName: 'USER',
    expiration: '30d',
  })

  return response?.token
}

export async function updateUser(user: UpdateUserRequest) {
  try {
    return await users.updateUser(user)
  } catch (e) {
    console.log(e)
  }
}
