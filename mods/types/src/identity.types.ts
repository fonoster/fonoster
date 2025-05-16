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
import { ListRequest, ListResponse } from "./common";
import { Role, WorkspaceMemberStatus } from "./workspaces.types";

type User = {
  ref: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
};

type Member = {
  ref: string;
  userRef: string;
  name: string;
  email: string;
  role: Role;
  status: WorkspaceMemberStatus;
  createdAt: Date;
  updatedAt: Date;
};

type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  avatar: string;
};

type CreateUserWithOauth2CodeRequest = {
  code: string;
};

type CreateApiKeyResponse = {
  ref: string;
  accessKeyId: string;
  accessKeySecret: string;
};

type UpdateUserRequest = {
  ref: string;
  name?: string;
  password?: string;
  avatar?: string;
};

type CreateApiKeyRequest = {
  role: Role;
  expiresAt?: number;
};

type RegenerateApiKeyResponse = {
  ref: string;
  accessKeyId: string;
  accessKeySecret: string;
};

type ApiKey = {
  ref: string;
  accessKeyId: string;
  role: Role;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type SendResetPasswordCodeRequest = {
  username: string;
  resetPasswordUrl: string;
};

type ResetPasswordRequest = {
  username: string;
  password: string;
  verificationCode: string;
};

type ExchangeCredentialsResponse = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
};

type ListApiKeysRequest = ListRequest;

type ListApiKeysResponse = ListResponse<ApiKey>;

type ListWorkspaceMembersRequest = ListRequest;

type ListWorkspaceMembersResponse = ListResponse<Member>;

export {
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  CreateUserWithOauth2CodeRequest,
  CreateUserRequest,
  ListApiKeysRequest,
  ListApiKeysResponse,
  RegenerateApiKeyResponse,
  ListWorkspaceMembersRequest,
  ListWorkspaceMembersResponse,
  UpdateUserRequest,
  SendResetPasswordCodeRequest,
  ResetPasswordRequest,
  User,
  ExchangeCredentialsResponse
};
