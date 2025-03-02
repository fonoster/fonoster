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
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { Flatten, RenameAndConvertToTimestamp } from "./utils";

type Credentials = {
  ref: string;
  name: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
};

type CredentialsExtended = RenameAndConvertToTimestamp<Credentials> & {
  extended?: Record<string, unknown>;
};

type CreateCredentialsRequest = {
  name: string;
  username: string;
  password: string;
};

type CreateCredentialsRequestExtended = CreateCredentialsRequest & {
  extended?: Record<string, unknown>;
};

type UpdateCredentialsRequest = Flatten<BaseApiObject & { name: string }>;

type ListCredentialsRequest = ListRequest;

type ListCredentialsResponse = ListResponse<Credentials>;

type ListCredentialsResponseExtended = ListResponse<CredentialsExtended>;

type CredentialsApi = {
  createCredentials(
    request: CreateCredentialsRequestExtended
  ): Promise<BaseApiObject>;
  updateCredentials(request: UpdateCredentialsRequest): Promise<BaseApiObject>;
  getCredentials(ref: string): Promise<CredentialsExtended>;
  deleteCredentials(ref: string): Promise<void>;
  listCredentials(
    request: ListCredentialsRequest
  ): Promise<ListCredentialsResponseExtended>;
};

export {
  CreateCredentialsRequest,
  CreateCredentialsRequestExtended,
  Credentials,
  CredentialsApi,
  CredentialsExtended,
  ListCredentialsRequest,
  ListCredentialsResponse,
  UpdateCredentialsRequest
};
