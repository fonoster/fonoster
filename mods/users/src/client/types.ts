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
export interface IUsersClient {
  listUsers(request: ListUsersRequest): Promise<ListUsersResponse>;
  createUser(request: CreateUserRequest): Promise<CreateUserResponse>;
  getUser(ref: string): Promise<GetUserResponse>;
  updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse>;
  deleteUser(ref: string): Promise<DeleteUserResponse>;
  createUserCredentials(
    request: CreateUserCredentialsRequest
  ): Promise<CreateUserCredentialsResponse>;
}

export interface ListUsersRequest {
  email?: string;
}
export interface ListUsersResponse {
  users: User[];
}

export interface User {
  ref: string;
  accessKeyId: string;
  email: string;
  name: string;
  avatar?: string;
  createTime: string;
  updateTime: string;
}

export interface CreateUserCredentialsRequest {
  email: string;
  secret: string;
  expiration?: string;
}

export interface CreateUserCredentialsResponse {
  accessKeyId: string;
  accessKeySecret: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  secret: string;
  avatar?: string;
}

export interface CreateUserResponse {
  ref: string;
  accessKeyId: string;
  email: string;
  name: string;
  avatar?: string;
  createTime: string;
  updateTime: string;
}

export interface UpdateUserRequest {
  ref: string;
  email?: string;
  name?: string;
  secret?: string;
  avatar?: string;
  limiter?: string;
  status?: string;
}

export interface UpdateUserResponse {
  ref: string;
}

export interface GetUserRequest {
  ref: string;
}

export interface GetUserResponse {
  ref: string;
  accessKeyId: string;
  email: string;
  name: string;
  avatar: string;
  createTime: string;
  updateTime: string;
  limiter: string;
  status: string;
}

export interface DeleteUserRequest {
  ref: string;
}

export interface DeleteUserResponse {
  ref: string;
}
