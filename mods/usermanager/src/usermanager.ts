import { FonosService, UserManagerService, UserManagerPB } from '@fonos/core'

interface CreateUserRequest {
  firstName: string,
  lastName: string,
  username: string,
  email : string,
  accessKeyId : string
}

interface User {
  firstname: string,
  lastname: string,
  username: string,
  email : string,
  accessKeyId : string
  role : string,
  createTime : string,
  updateTime : string,
  status : string
}

/**
 * @classdesc Use Fonos UserManager, a capability of Fonos Systems Manager,
 * to create and manage users and roles. Fonos UserManager requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const users = new Fonos.UserManager()
 *
 * users.roleHasAccess(role, service)
 * .then(hasAccess => {
 *   console.log('hasAccess: ' + hasAccess) // successful response
 * }).catch(e => console.error(e))          // an error occurred
 */
export default class UserManager extends FonosService {

  /**
   * Constructs a new AppManager Object.
   *
   * @see module:core:FonosService
   */
  constructor (options?: any) {
    super(UserManagerService.UserManagerClient, options)
    super.init()
    const { promisifyAll } = require('grpc-promise')
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  /**
   * Checks if a given role has access to a service.
   *
   * @param {RoleHasAccessRequest} request - The name of the application
   * @example
   *
   * users.createUser({})
   * .then(hasAccess => {
   *   console.log('hasAccess:' + hasAccess)  // returns true if role has access to the service
   * }).catch(e => console.error(e))          // an error occurred
   */
  async createUser (request: CreateUserRequest): Promise<User> {
    const user = new UserManagerPB.User();
    user.setFirstname(request.firstName)
    user.setLastname(request.lastName)
    user.setUsername(request.username)
    user.setEmail(request.email)
    user.setAccessKeyId(request.accessKeyId)
    const req = new UserManagerPB.CreateUserRequest()
    req.setUser(user);

    const userFromDatabase =  await super
    .getService()
    .createUser()
    .sendMessage(req)

    return {
      firstname: userFromDatabase.getFirstName(),
      lastname: userFromDatabase.getLastName(),
      username: userFromDatabase.getUserName(),
      email : userFromDatabase.getEmail(),
      accessKeyId : userFromDatabase.getAccessKeyId(),
      role : userFromDatabase.getRole(),
      createTime : userFromDatabase.getCreateTime(),
      updateTime : userFromDatabase.UpdateTime(),
      status : userFromDatabase.getStatus()
    }
  }
}
