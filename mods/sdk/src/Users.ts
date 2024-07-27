/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
  UpdateUserRequest,
  User
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateUserRequest as CreateUserRequestPB,
  CreateUserResponse as CreateUserResponsePB,
  DeleteUserRequest as DeleteUserRequestPB,
  DeleteUserResponse as DeleteUserResponsePB,
  GetUserRequest as GetUserRequestPB,
  GetUserResponse as GetUserResponsePB,
  UpdateUserRequest as UpdateUserRequestPB,
  UpdateUserResponse as UpdateUserResponsePB
} from "./generated/node/identity_pb";

class Users {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

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

  async getUser(ref: string): Promise<User> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      GetUserRequestPB,
      GetUserResponsePB,
      { ref: string },
      User
    >({
      method: client.getUser.bind(client),
      requestPBObjectConstructor: GetUserRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

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
