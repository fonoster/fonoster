/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { APIClient, ClientOptions } from "@fonoster/common";
import { UsersClient } from "../service/protos/users_grpc_pb";
import UsersPB from "../service/protos/users_pb";
import CommonPB from "../service/protos/common_pb";
import { promisifyAll } from "grpc-promise";
import {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserResponse,
  GetUserResponse,
  CreateUserCredentialsRequest,
  UpdateUserRequest,
  UpdateUserResponse,
  CreateUserCredentialsResponse,
  IUsersClient,
  ListUsersRequest,
  ListUsersResponse,
  User
} from "./types";

/**
 * @classdesc Use Fonoster Users, a capability of Fonoster,
 * to create, update, get and delete Users. Users requires of a
 * running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk")
 * const users = new Fonoster.Users()
 *
 * const request = {
 *   email: "john.doe@email.com",
 *   name: "John Doe",
 *   secret: "s3cur3pass",
 *   avatar: "https://avatar.com/avt?userId=2124252"
 * }
 *
 * users.createUser(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Users extends APIClient implements IUsersClient {
  /**
   * Constructs a new Users object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(UsersClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Return a list of Users.
   *
   * @param {ListUsersRequest} request - Request filters
   * @param {string} request.email - Optional email filter
   * @return {Promise<ListUsersResponse>}
   * @example
   *
   * projects.listUsers({ email: "john.doe@email.com" })
   * .then(result => {
   *   console.log(result)             // successful response
   * }).catch(e => console.error(e))   // an error occurred
   */
  async listUsers(request?: ListUsersRequest): Promise<ListUsersResponse> {
    const res = new UsersPB.ListUsersRequest();
    res.getFiltersMap().set("email", request.email);

    const paginatedList = await super.getService().listUsers().sendMessage(res);

    return {
      users: paginatedList.getUsersList().map((p: UsersPB.User) => {
        return {
          ref: p.getRef(),
          accessKeyId: p.getAccessKeyId(),
          email: p.getEmail(),
          name: p.getName(),
          avatar: p.getAvatar(),
          createTime: p.getCreateTime(),
          updateTime: p.getUpdateTime()
        };
      })
    };
  }

  /**
   * Create a new Fonoster User.
   *
   * @param {CreateUserRequest} request -  Request for the provision of a new User
   * @param {string} request.email - User's email
   * @param {string} request.name - User's full name
   * @param {string} request.secret - Login password
   * @param {string} request.avatar - Optional URL to User's avatar
   * @return {Promise<CreateUserResponse>}
   * @example
   *
   * const request = {
   *   email: "john.doe@email.com",
   *   name: "John Doe",
   *   secret: "s3cur3pass",
   *   avatar: "https://avatar.com/avt?userId=2124252"
   * }
   *
   * users.createUser(request)
   * .then(result => {
   *   console.log(result)             // successful response
   * }).catch(e => console.error(e))   // an error occurred
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    const user = new UsersPB.CreateUserRequest();
    user.setEmail(request.email);
    user.setName(request.name);
    user.setSecret(request.secret);
    user.setAvatar(request.avatar);

    const res = await super.getService().createUser().sendMessage(user);

    return {
      ref: res.getRef(),
      accessKeyId: res.getAccessKeyId(),
      email: res.getEmail(),
      name: res.getName(),
      avatar: res.getAvatar(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Retrives an User by reference.
   *
   * @param {string} ref - Reference to User
   * @return {Promise<GetUserResponse>} The User
   * @throws if ref is null or User does not exist
   * @example
   *
   * const ref = "507f1f77bcf86cd799439011";
   *
   * users.getUser(ref)
   * .then(result => {
   *   console.log(result)             // returns the User payload
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getUser(ref: string): Promise<GetUserResponse> {
    const request = new UsersPB.GetUserRequest();
    request.setRef(ref);
    const res = await super.getService().getUser().sendMessage(request);

    return {
      ref: res.getRef(),
      accessKeyId: res.getAccessKeyId(),
      email: res.getEmail(),
      name: res.getName(),
      avatar: res.getAvatar(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime(),
      limiter: res.getLimiter(),
      status: res.getStatus()
    };
  }

  /**
   * Update a Fonoster User.
   *
   * @param {UpdateUserRequest} request - Request update of an User
   * @param {string} request.ref - Required reference to the User
   * @param {string} request.name - Optionally update the name
   * @param {string} request.avatar - Optionally update the avatar
   * @param {string} request.secret - Optionally update User's password
   * @return {Promise<UpdateUserResponse>}
   * @example
   *
   * const request = {
   *   name: "John Dee",
   *   secret: "s3cur3pass"
   * }
   *
   * users.updateUser(request)
   * .then(result => {
   *   console.log(result)            // returns the UpdateUserResponse payload
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    const req = new UsersPB.UpdateUserRequest();
    req.setRef(request.ref);
    if (request.name) req.setName(request.name);
    if (request.secret) req.setSecret(request.secret);
    if (request.avatar) req.setAvatar(request.avatar);
    if (request.status) req.setStatus(request.status);
    if (request.limiter) req.setLimiter(request.limiter);

    const res = await super.getService().updateUser().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * Delete an Fonoster User.
   *
   * @param {string} ref - User's reference
   * @example
   *
   * const ref = "507f1f77bcf86cd799439011"
   *
   * users.deleteUser(ref)
   * .then(() => {
   *   console.log("done")            // returns a reference of the User
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteUser(ref: string): Promise<DeleteUserResponse> {
    const req = new UsersPB.DeleteUserRequest();
    req.setRef(ref);
    await super.getService().deleteUser().sendMessage(req);
    return { ref };
  }

  /**
   * Login using email and a password.
   *
   * @param {createUserCredentials} request - Request update of an User
   * @param {string} request.email - Login username
   * @param {string} request.secret - Login password
   * @example
   *
   * const request = {
   *  email: "john.doe@email.com",
   *  secret: "s3cur3pass",
   *  expiration: "30d"
   * }
   *
   * users.createUserCredentials(request)
   * .then(result => {
   *   console.log(result)            // returns an accessKeyId and accessKeySecret
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createUserCredentials(
    request: CreateUserCredentialsRequest
  ): Promise<CreateUserCredentialsResponse> {
    const req = new UsersPB.CreateUserCredentialsRequest();
    req.setEmail(request.email);
    req.setSecret(request.secret);

    if (request.expiration) req.setExpiration(request.expiration);

    const res = await super
      .getService()
      .createUserCredentials()
      .sendMessage(req);

    return {
      accessKeyId: res.getAccessKeyId(),
      accessKeySecret: res.getAccessKeySecret()
    };
  }
}

export { User, UsersPB, CommonPB, IUsersClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Users;
module.exports.UsersPB = UsersPB;
module.exports.CommonPB = CommonPB;
