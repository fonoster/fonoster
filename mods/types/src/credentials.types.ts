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
import { BaseApiObject } from "./common";

type CredentialsExtended = {
  ref: string;
  name: string;
  username: string;
  password: string;
  extended?: Record<string, unknown>;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateCredentialsRequestExtended = {
  name: string;
  username: string;
  password: string;
  extended: {
    accessKeyId: string;
  };
};

type UpdateCredentialsRequest = BaseApiObject &
  Omit<Partial<CreateCredentialsRequest>, "username" | "extended">;

type ListCredentialsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListCredentialsResponse = {
  items: Credentials[];
  nextPageToken: string;
};

type CredentialsApi = {
  createCredentials(
    request: CreateCredentialsRequestExtended
  ): Promise<BaseApiObject>;
  updateCredentials(request: UpdateCredentialsRequest): Promise<BaseApiObject>;
  getCredentials(ref: string): Promise<CredentialsExtended>;
  deleteCredentials(ref: string): Promise<void>;
  listCredentials(
    request: ListCredentialsRequest
  ): Promise<ListCredentialsResponse>;
};

type Credentials = Omit<CredentialsExtended, "extended">;

type CreateCredentialsRequest = Omit<
  CreateCredentialsRequestExtended,
  "extended"
>;

export {
  Credentials,
  CredentialsExtended,
  CreateCredentialsRequest,
  CreateCredentialsRequestExtended,
  UpdateCredentialsRequest,
  ListCredentialsRequest,
  ListCredentialsResponse,
  CredentialsApi
};
