/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
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
import * as c from "./generated/api";
import { IUsersClient } from "@fonoster/users";
import {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserResponse,
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  CreateUserCredentialsRequest,
  CreateUserCredentialsResponse,
  ListUsersRequest,
  ListUsersResponse
} from "../../users/src/client/types";
import { WebClientOptions } from "./types";
import WebAPIClient from "./web_client";

export default class Users extends WebAPIClient implements IUsersClient {
  constructor(options: WebClientOptions) {
    super(c, "UsersApi", options);
  }

  async listUsers(request: ListUsersRequest): Promise<ListUsersResponse> {
    return (await super.run("listUsers", request)) as any;
  }

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return (await super.run("createUser", request)) as any;
  }

  async getUser(ref: string): Promise<GetUserResponse> {
    return (await super.run("getUser", ref)) as any;
  }

  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    return (await super.run("updateUser", request)) as any;
  }

  async deleteUser(ref: string): Promise<DeleteUserResponse> {
    return (await super.run("deleteUser", ref)) as any;
  }

  async createUserCredentials(
    request: CreateUserCredentialsRequest
  ): Promise<CreateUserCredentialsResponse> {
    return (await super.run("createUserCredentials", request)) as any;
  }
}
