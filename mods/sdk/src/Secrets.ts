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
  BaseApiObject,
  CreateSecretRequest,
  ListSecretsRequest,
  ListSecretsResponse,
  Secret,
  UpdateSecretRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateSecretRequest as CreateSecretRequestPB,
  CreateSecretResponse as CreateSecretResponsePB,
  DeleteSecretRequest as DeleteSecretRequestPB,
  DeleteSecretResponse as DeleteSecretResponsePB,
  GetSecretRequest as GetSecretRequestPB,
  ListSecretsRequest as ListSecretsRequestPB,
  ListSecretsResponse as ListSecretsResponsePB,
  Secret as SecretPB,
  UpdateSecretRequest as UpdateSecretRequestPB,
  UpdateSecretResponse as UpdateSecretResponsePB
} from "./generated/node/secrets_pb";

class Secrets {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createSecret(request: CreateSecretRequest): Promise<BaseApiObject> {
    const client = this.client.getSecretsClient();
    return await makeRpcRequest<
      CreateSecretRequestPB,
      CreateSecretResponsePB,
      CreateSecretRequest,
      BaseApiObject
    >({
      method: client.createSecret.bind(client),
      requestPBObjectConstructor: CreateSecretRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async getSecret(ref: string) {
    const client = this.client.getSecretsClient();
    return await makeRpcRequest<
      GetSecretRequestPB,
      SecretPB,
      BaseApiObject,
      Secret
    >({
      method: client.getSecret.bind(client),
      requestPBObjectConstructor: GetSecretRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  async updateSecret(request: UpdateSecretRequest): Promise<BaseApiObject> {
    const client = this.client.getSecretsClient();
    return await makeRpcRequest<
      UpdateSecretRequestPB,
      UpdateSecretResponsePB,
      UpdateSecretRequest,
      BaseApiObject
    >({
      method: client.updateSecret.bind(client),
      requestPBObjectConstructor: UpdateSecretRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async listSecrets(request: ListSecretsRequest): Promise<ListSecretsResponse> {
    const client = this.client.getSecretsClient();
    return await makeRpcRequest<
      ListSecretsRequestPB,
      ListSecretsResponsePB,
      ListSecretsRequest,
      ListSecretsResponse
    >({
      method: client.listSecrets.bind(client),
      requestPBObjectConstructor: ListSecretsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", SecretPB]]
    });
  }

  async deleteSecret(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getSecretsClient();
    return await makeRpcRequest<
      DeleteSecretRequestPB,
      DeleteSecretResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteSecret.bind(applicationsClient),
      requestPBObjectConstructor: DeleteSecretRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Secrets };
