/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import {FonosService, ServiceOptions} from "@fonos/common";
import {UsersClient} from "../service/protos/Users_grpc_pb";
import UsersPB from "../service/protos/Users_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserResponse,
  GetUserResponse,
  LoginRequest,
  LoginResponse,
  UpdateUserRequest,
  UpdateUserResponse
} from "./types";

/**
 * @classdesc Use Fonos Users, a capability of Fonos,
 * to create, update, get and delete Users. Users requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require("@fonos/sdk")
 * const Users = new Fonos.Users()
 *
 * const request = {
 *   email: "john.doe@email.com",
 *   name: "John Doe",
 *   secret: "s3cur3pass",
 *   avatar: "https://avatar.com/avt?userId=2124252"
 * }
 *
 * Users.createUser(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Users extends FonosService {
  /**
   * Constructs a new Users object.
   *
   * @param {ServiceOptions} options - Options to indicate the objects endpoint
   * @see module:core:FonosService
   */
  constructor(options?: ServiceOptions) {
    super(UsersClient, options);
    super.init();
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  /**
   * Creates a new User on Fonos.
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
   * Users.createUser(request)
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
   * Users.getUser(ref)
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
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Updates an User.
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
   * Users.updateUser(request)
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

    const res = await super.getService().updateUser().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * Deletes an User.
   *
   * @param {string} ref - User's reference
   * @example
   *
   * const ref = "507f1f77bcf86cd799439011"
   *
   * Users.deleteUser(ref)
   * .then(() => {
   *   console.log("done")            // returns a reference of the User
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteUser(ref: string): Promise<DeleteUserResponse> {
    const req = new UsersPB.DeleteUserRequest();
    req.setRef(ref);
    await super.getService().deleteUser().sendMessage(req);
    return {ref};
  }

  /**
   * Login using email and a password.
   *
   * @param {LoginRequest} request - Request update of an User
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
   * Users.loginUser(request)
   * .then(result => {
   *   console.log(result)            // returns an accessKeyId and accessKeySecret
   * }).catch(e => console.error(e))  // an error occurred
   */
  async loginUser(request: LoginRequest): Promise<LoginResponse> {
    const req = new UsersPB.LoginRequest();
    req.setEmail(request.email);
    req.setSecret(request.secret);

    if (request.expiration) req.setExpiration(request.expiration);

    const res = await super.getService().loginUser().sendMessage(req);

    return {
      accessKeyId: res.getAccessKeyId(),
      accessKeySecret: res.getAccessKeySecret()
    };
  }
}

export {UsersPB, CommonPB};

// WARNING: Workaround for support to commonjs clients
module.exports = Users;
module.exports.UsersPB = UsersPB;
module.exports.CommonPB = CommonPB;
