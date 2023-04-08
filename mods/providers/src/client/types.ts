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
export interface IProvidersClient {
  createProvider(
    request: CreateProviderRequest
  ): Promise<CreateProviderResponse>;
  getProvider(ref: string): Promise<GetProviderResponse>;
  updateProvider(
    request: UpdateProviderRequest
  ): Promise<UpdateProviderResponse>;
  listProviders(request: ListProvidersRequest): Promise<ListProvidersResponse>;
  deleteProvider(ref: string): Promise<DeleteProviderResponse>;
}

export interface Provider {
  ref: string;
  name: string;
  username: string;
  secret: string;
  host: string;
  transport: string;
  expires: number;
  createTime?: string;
  updateTime?: string;
  register?: boolean;
}

export interface CreateProviderRequest {
  ref?: string;
  name: string;
  username: string;
  secret: string;
  host: string;
  transport: string;
  expires: number;
  register?: boolean;
}

export interface CreateProviderResponse {
  ref: string;
  name: string;
  username: string;
  secret: string;
  host: string;
  transport: string;
  expires: number;
  createTime: string;
  updateTime: string;
  register?: boolean;
}

export interface GetProviderResponse {
  ref: string;
  name: string;
  username: string;
  secret: string;
  host: string;
  transport: string;
  expires: number;
  createTime: string;
  updateTime: string;
  register?: boolean;
}

export interface UpdateProviderRequest {
  ref: string;
  name?: string;
  username?: string;
  secret?: string;
  host?: string;
  transport?: string;
  expires?: number;
  register?: boolean;
}

export interface UpdateProviderResponse {
  ref: string;
}

export interface ListProvidersRequest {
  pageSize?: number;
  pageToken?: string;
  view?: number;
}

export interface ListProvidersResponse {
  nextPageToken: string;
  providers: Provider[];
}

export interface DeleteProviderResponse {
  ref: string;
}
