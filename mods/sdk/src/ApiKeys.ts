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
import {
  ApiRoleEnum,
  BaseApiObject,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysRequest,
  ListApiKeysResponse,
  RegenerateApiKeyResponse
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  ApiKey as ApiKeyPB,
  CreateApiKeyRequest as CreateApiKeyRequestPB,
  CreateApiKeyResponse as CreateApiKeyResponsePB,
  DeleteApiKeyRequest as DeleteApiKeyRequestPB,
  DeleteApiKeyResponse as DeleteApiKeyResponsePB,
  ListApiKeysRequest as ListApiKeysRequestPB,
  ListApiKeysResponse as ListApiKeysResponsePB,
  RegenerateApiKeyRequest as RegenerateApiKeyRequestPB,
  RegenerateApiKeyResponse as RegenerateApiKeyResponsePB
} from "./generated/node/identity_pb";

class ApiKeys {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createApiKey(
    request: CreateApiKeyRequest
  ): Promise<CreateApiKeyResponse> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      CreateApiKeyRequestPB,
      CreateApiKeyResponsePB,
      CreateApiKeyRequest,
      CreateApiKeyResponse
    >({
      method: client.createApiKey.bind(client),
      requestPBObjectConstructor: CreateApiKeyRequestPB,
      metadata: this.client.getMetadata(),
      request,
      enumMapping: [["role", ApiRoleEnum]]
    });
  }

  async regenerateApiKey(ref: string): Promise<CreateApiKeyResponse> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      RegenerateApiKeyRequestPB,
      RegenerateApiKeyResponsePB,
      BaseApiObject,
      RegenerateApiKeyResponse
    >({
      method: client.regenerateApiKey.bind(client),
      requestPBObjectConstructor: RegenerateApiKeyRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  async listApiKeys(request: ListApiKeysRequest): Promise<ListApiKeysResponse> {
    const applicationsClient = this.client.getIdentityClient();
    return await makeRpcRequest<
      ListApiKeysRequestPB,
      ListApiKeysResponsePB,
      ListApiKeysRequest,
      ListApiKeysResponse
    >({
      method: applicationsClient.listApiKeys.bind(applicationsClient),
      requestPBObjectConstructor: ListApiKeysRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", ApiKeyPB]]
    });
  }

  async deleteApiKey(ref: string): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      DeleteApiKeyRequestPB,
      DeleteApiKeyResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: client.deleteApiKey.bind(client),
      requestPBObjectConstructor: DeleteApiKeyRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { ApiKeys };
