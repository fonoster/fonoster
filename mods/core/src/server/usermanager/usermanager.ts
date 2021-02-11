import grpc from 'grpc'
import { FonosAuthError } from '@fonos/errors'
import createUser from './create_user'
import listUsers from './list_user'
import getUser from './get_user'
import deleteUser from './delete_user'

import {
  User,
  ListUsersRequest,
  ListUsersResponse,
  GetUserRequest,
  CreateUserRequest,
  UpdateUserRequest,
  DeleteUserRequest
} from '../protos/usermanager_pb'

import { Empty } from '../protos/common_pb'

//import { auth } from '../../common/trust_util'
import { auth } from '../../common/trust_util'

import {
  IUserManagerService,
  UserManagerService,
  IUserManagerServer
} from '../protos/usermanager_grpc_pb'

class UserManagerServer implements IUserManagerServer {
  async listUsers (
    call: grpc.ServerUnaryCall<ListUsersRequest>,
    callback: grpc.sendUnaryData<ListUsersResponse>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)

    try {
      const result = await listUsers(
        parseInt(call.request.getPageToken()),
        call.request.getPageSize()
      )
      const response = new ListUsersResponse()
      response.setUsersList(result.users)
      if (result.pageToken) response.setNextPageToken('' + result.pageToken)
      callback(null, response)
    } catch (e) {
      callback(e, null)
    }
  }

  async getUser (
    call: grpc.ServerUnaryCall<GetUserRequest>,
    callback: grpc.sendUnaryData<User>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      let mail = call.request.getEmail()
      let usr = await getUser(mail)
      callback(null, usr)
    } catch (e) {
      callback(e, null)
    }
  }

  async createUser (
    call: grpc.ServerUnaryCall<CreateUserRequest>,
    callback: grpc.sendUnaryData<User>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      let user = call.request.getUser()

      callback(null, await createUser(call.request.getUser()))
    } catch (e) {
      callback(e, null)
    }
  }

  updateUser (
    call: grpc.ServerUnaryCall<UpdateUserRequest>,
    callback: grpc.sendUnaryData<User>
  ): void {
    if (!auth(call)) return callback(new FonosAuthError(), null)
  }

  async deleteUser (
    call: grpc.ServerUnaryCall<DeleteUserRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      await deleteUser(call.request.getEmail())
      callback(null, new Empty())
    } catch (e) {
      callback(e, null)
    }
  }
}

export { UserManagerServer as default, IUserManagerService, UserManagerService }
