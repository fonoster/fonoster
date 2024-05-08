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
import { JsonObject } from "@prisma/client/runtime/library";

type Credentials = {
  ref: string;
  name: string;
  username: string;
  password: string;
  extended?: JsonObject;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateCredentialsRequest = {
  name: string;
  username: string;
  password: string;
  extended: {
    accessKeyId: string;
  };
};

type UpdateCredentialsRequest = {
  ref: string;
} & Omit<Partial<CreateCredentialsRequest>, "username" | "extended">;

type CreateCredentialsResponse = {
  ref: string;
};

type UpdateCredentialsResponse = {
  ref: string;
};

type GetCredentialsRequest = {
  ref: string;
};

type DeleteCredentialsRequest = {
  ref: string;
};

type ListCredentialsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListCredentialsResponse = {
  items: Credentials[];
  nextPageToken: string;
};

type CredentialsAPI = {
  createCredentials(
    request: CreateCredentialsRequest
  ): Promise<CreateCredentialsResponse>;
  updateCredentials(
    request: UpdateCredentialsRequest
  ): Promise<UpdateCredentialsResponse>;
  getCredentials(ref: string): Promise<Credentials>;
  deleteCredentials(ref: string): Promise<void>;
  listCredentials(
    request: ListCredentialsRequest
  ): Promise<ListCredentialsResponse>;
};

export {
  Credentials,
  CreateCredentialsRequest,
  UpdateCredentialsRequest,
  CreateCredentialsResponse,
  UpdateCredentialsResponse,
  GetCredentialsRequest,
  DeleteCredentialsRequest,
  ListCredentialsRequest,
  ListCredentialsResponse,
  CredentialsAPI
};
