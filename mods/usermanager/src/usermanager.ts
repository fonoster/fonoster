import { FonosService, UserManagerService, UserManagerPB } from '@fonos/core'
import { use } from 'chai'

interface RoleHasAccessRequest {
  role: string,
  service: string
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
   * users.roleHasAccess({role: 'USER', sevice: '...'})
   * .then(hasAccess => {
   *   console.log('hasAccess:' + hasAccess)  // returns true if role has access to the service
   * }).catch(e => console.error(e))          // an error occurred
   */

  /*async createUser (request: RoleHasAccessRequest): Promise<boolean> {
    /*const r = new UserManagerPB.RoleHasAccessRequest()
    r.setRole(request.role)
    r.setService(request.service)
    return super.getService().roleHasAccess().sendMessage(r)
  }*/


  async createUser (request: any): Promise<any> {
    const user = new UserManagerPB.User();
    user.setFirstname(request.firstname)
    user.setLastname(request.lastname)
    user.setUsername(request.username)
    user.setEmail(request.email)
    user.setAccessKeyId(request.access_key_id)
    user.setRole(request.role)
    user.setCreateTime(request.createTime)
    user.setUpdateTime(request.updateTime)
    user.setStatus(request.status)

    const req = new UserManagerPB.CreateUserRequest()
    req.setUser(user);

    return super
      .getService()
      .createUser()
      .sendMessage(req)
  }



}
