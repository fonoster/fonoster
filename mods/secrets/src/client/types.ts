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
export interface ISecretsClient {
  createSecret(request: CreateSecretRequest): Promise<CreateSecretResponse>;
  getSecret(ref: string): Promise<GetSecretResponse>;
  listSecrets(request: ListSecretsRequest): Promise<ListSecretsResponse>;
  deleteSecret(ref: string): void;
}
export interface CreateSecretRequest {
  name: string;
  secret: string;
}

export interface CreateSecretResponse {
  name: string;
}

export interface GetSecretResponse {
  name: string;
  secret: string;
}

export interface ListSecretsRequest {
  pageSize: number;
  pageToken: string;
}

export interface ListSecretsResponse {
  secrets: Secret[];
  nextPageToken: string;
}

export interface Secret {
  name: string;
}
