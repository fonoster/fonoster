/*
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
import { WorkspaceMemberStatus } from "./workspaces.types";

enum ApiRole {
  WORKSPACE_ADMIN = "WORKSPACE_ADMIN"
}

enum WorkspaceMemberRole {
  OWNER = "OWNER",
  ADMIN = "WORKSPACE_ADMIN",
  USER = "USER"
}

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
  role: WorkspaceMemberRole;
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
  role: ApiRole;
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
  role: ApiRole;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ListApiKeysRequest = ListRequest;

type ListApiKeysResponse = ListResponse<ApiKey>;

type ListWorkspaceMembersRequest = ListRequest;

type ListWorkspaceMembersResponse = ListResponse<Member>;

export {
  ApiRole,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  CreateUserRequest,
  ListApiKeysRequest,
  ListApiKeysResponse,
  RegenerateApiKeyResponse,
  ListWorkspaceMembersRequest,
  ListWorkspaceMembersResponse,
  UpdateUserRequest,
  User,
  WorkspaceMemberRole
};
