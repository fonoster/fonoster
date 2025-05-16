/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import {
  BaseApiObject,
  CreateUserRequest,
  CreateUserWithOauth2CodeRequest,
  ExchangeCredentialsResponse,
  ResetPasswordRequest,
  SendResetPasswordCodeRequest,
  UpdateUserRequest,
  User
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateUserRequest as CreateUserRequestPB,
  CreateUserResponse as CreateUserResponsePB,
  CreateUserWithOauth2CodeRequest as CreateUserWithOauth2CodeRequestPB,
  DeleteUserRequest as DeleteUserRequestPB,
  DeleteUserResponse as DeleteUserResponsePB,
  ExchangeCredentialsResponse as ExchangeCredentialsResponsePB,
  GetUserRequest as GetUserRequestPB,
  ResetPasswordRequest as ResetPasswordRequestPB,
  SendResetPasswordCodeRequest as SendResetPasswordCodeRequestPB,
  UpdateUserRequest as UpdateUserRequestPB,
  UpdateUserResponse as UpdateUserResponsePB,
  User as UserPB
} from "./generated/node/identity_pb";

/**
 * @classdesc Fonoster Users, part of the Fonoster Identity subsystem,
 * allows you to create, update, retrieve, and delete a Users in the system.
 * Note that an active Fonoster deployment is required.
 *
 * @example
 * const SDK = require("@fonoster/sdk");
 *
 * const client = SDK.Client();
 * const users = new SDK.Users(client);
 *
 * const request = {
 *   name: "John Doe",
 *   email: "john.doe@example.com",
 *   password: "password",
 *   avatar: "https://example.com/avatar.jpg"
 * };
 *
 * users.createUser(request)
 *   .then(console.log) // successful response
 *   .catch(console.error); // an error occurred
 */
class Users {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Users object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new User in the Workspace.
   *
   * @param {CreateUserRequest} request - The request object that contains the necessary information to create a new User
   * @param {string} request.name - The name of the User
   * @param {string} request.email - The email of the User
   * @param {string} request.password - The password of the User
   * @param {string} request.avatar - The avatar of the User
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created User
   * @example
   * const users = new SDK.Users(client); // Existing client object
   *
   * const request = {
   *   name: "John Doe",
   *   email: "john.doe@example.com",
   *   password: "password",
   *   avatar: "https://example.com/avatar.jpg"
   * };
   *
   * users
   *   .createUser(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async createUser(request: CreateUserRequest): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      CreateUserRequestPB,
      CreateUserResponsePB,
      CreateUserRequest,
      BaseApiObject
    >({
      method: client.createUser.bind(client),
      requestPBObjectConstructor: CreateUserRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Create a new User using an OAuth2 code and return the id, access, and refresh tokens for the User.
   *
   * @param {CreateUserWithOauth2CodeRequest} request - The request object with the OAuth2 code
   * @param {string} request.code - The OAuth2 code of the User
   * @return {Promise<ExchangeCredentialsResponse>} - The response object that contains the id, access, and refresh tokens
   * @example
   * const users = new SDK.Users(client); // Existing client object
   *
   * const request = {
   *   code: "fd4d78beb31aa25b93de"
   * };
   *
   * users.createUserWithOauth2Code(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async createUserWithOauth2Code(
    request: CreateUserWithOauth2CodeRequest
  ): Promise<ExchangeCredentialsResponse> {
    console.log("request", request);
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      CreateUserWithOauth2CodeRequestPB,
      ExchangeCredentialsResponsePB,
      CreateUserWithOauth2CodeRequest,
      ExchangeCredentialsResponse
    >({
      method: client.createUserWithOauth2Code.bind(client),
      requestPBObjectConstructor: CreateUserWithOauth2CodeRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Retrieves an existing User in the Workspace.
   *
   * @param {string} ref - The reference of the User to retrieve
   * @return {Promise<Acl>} - The response object that contains the User
   * @example
   * const users = new SDK.Users(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * users
   *   .getUser(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getUser(ref: string): Promise<User> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<GetUserRequestPB, UserPB, BaseApiObject, User>({
      method: client.getUser.bind(client),
      requestPBObjectConstructor: GetUserRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  /**
   * Updates an existing User in the Workspace.
   *
   * @param {UpdateUserRequest} request - The request object that contains the necessary information to update a User
   * @param {string} request.ref - The reference of the User to update
   * @param {string} request.name - The name of the User
   * @param {string} request.password - The password of the User
   * @param {string} request.avatar - The avatar of the User
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated User
   * @example
   * const users = new SDK.Users(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "John Doe",
   *   password: "password",
   *   avatar: "https://example.com/avatar.jpg"
   * };
   *
   * users
   *   .updateUser(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async updateUser(request: UpdateUserRequest): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      UpdateUserRequestPB,
      UpdateUserResponsePB,
      UpdateUserRequest,
      BaseApiObject
    >({
      method: client.updateUser.bind(client),
      requestPBObjectConstructor: UpdateUserRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Sends a reset password code to the User.
   *
   * @param {SendResetPasswordCodeRequest} request - The request object that contains the necessary information to send a reset password code to a User
   * @param {string} request.username - The username of the User
   * @param {string} request.resetPasswordUrl - The URL to reset the password
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the User
   * @example
   * const users = new SDK.Users(client); // Existing client object
   *
   * const request = {
   *   username: "john.doe@example.com",
   *   resetPasswordUrl: "https://example.com/reset-password"
   * };
   *
   * users
   *   .sendResetPasswordCode(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async sendResetPasswordCode(
    request: SendResetPasswordCodeRequest
  ): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      SendResetPasswordCodeRequestPB,
      null,
      SendResetPasswordCodeRequest,
      never
    >({
      method: client.sendResetPasswordCode.bind(client),
      requestPBObjectConstructor: SendResetPasswordCodeRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Resets the password of the User.
   *
   * @param {ResetPasswordRequest} request - The request object that contains the necessary information to reset the password of a User
   * @param {string} request.username - The username of the User
   * @param {string} request.password - The new password of the User
   * @param {string} request.verificationCode - The verification code of the User
   * @return {Promise<void>} - The response object that contains the reference to the User
   * @example
   * const users = new SDK.Users(client); // Existing client object
   *
   * const request = {
   *   username: "john.doe@example.com",
   *   password: "password",
   *   verificationCode: "123456"
   * };
   *
   * users
   *   .resetPassword(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      ResetPasswordRequestPB,
      null,
      ResetPasswordRequest,
      never
    >({
      method: client.resetPassword.bind(client),
      requestPBObjectConstructor: ResetPasswordRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Deletes an existing User from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the User to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted User
   * @example
   * const users = new SDK.Users(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * users
   *   .deleteUser(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async deleteUser(ref: string): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      DeleteUserRequestPB,
      DeleteUserResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: client.deleteUser.bind(client),
      requestPBObjectConstructor: DeleteUserRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Users };
