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
enum ApiRoleEnum {
  WORKSPACE_ADMIN = "WORKSPACE_ADMIN"
}

type User = {
  ref: string;
  email: string;
  name: string;
  avatar: string;
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
  role: ApiRoleEnum;
  expiresAt?: number;
};

type RegenerateApiKeyResponse = {
  ref: string;
  accessKeyId: string;
  accessKeySecret: string;
};

type ListApiKeysRequest = {
  pageSize: number;
  pageToken: string;
};

type ApiKey = {
  ref: string;
  accessKeyId: string;
  role: ApiRoleEnum;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ListApiKeysResponse = {
  items: ApiKey[];
  nextPageToken?: string;
};

export {
  ApiRoleEnum,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RegenerateApiKeyResponse,
  ListApiKeysRequest,
  ListApiKeysResponse
};
