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
  CreateCredentialsRequest,
  Credentials as CredentialsType,
  ListCredentialsRequest,
  ListCredentialsResponse,
  UpdateCredentialsRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateCredentialsRequest as CreateCredentialsRequestPB,
  CreateCredentialsResponse as CreateCredentialsResponsePB,
  Credentials as CredentialsPB,
  DeleteCredentialsRequest as DeleteCredentialsRequestPB,
  DeleteCredentialsResponse as DeleteCredentialsResponsePB,
  GetCredentialsRequest as GetCredentialsRequestPB,
  ListCredentialsRequest as ListCredentialsRequestPB,
  ListCredentialsResponse as ListCredentialsResponsePB,
  UpdateCredentialsRequest as UpdateCredentialsRequestPB,
  UpdateCredentialsResponse as UpdateCredentialsResponsePB
} from "./generated/node/credentials_pb";

class Credentials {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createCredentials(
    request: CreateCredentialsRequest
  ): Promise<BaseApiObject> {
    const client = this.client.getCredentialsClient();
    return await makeRpcRequest<
      CreateCredentialsRequestPB,
      CreateCredentialsResponsePB,
      CreateCredentialsRequest,
      BaseApiObject
    >({
      method: client.createCredentials.bind(client),
      requestPBObjectConstructor: CreateCredentialsRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async getCredentials(ref: string) {
    const client = this.client.getCredentialsClient();
    return await makeRpcRequest<
      GetCredentialsRequestPB,
      CredentialsPB,
      BaseApiObject,
      CredentialsType
    >({
      method: client.getCredentials.bind(client),
      requestPBObjectConstructor: GetCredentialsRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  async updateCredentials(
    request: UpdateCredentialsRequest
  ): Promise<BaseApiObject> {
    const client = this.client.getCredentialsClient();
    return await makeRpcRequest<
      UpdateCredentialsRequestPB,
      UpdateCredentialsResponsePB,
      UpdateCredentialsRequest,
      BaseApiObject
    >({
      method: client.updateCredentials.bind(client),
      requestPBObjectConstructor: UpdateCredentialsRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async listCredentials(
    request: ListCredentialsRequest
  ): Promise<ListCredentialsResponse> {
    const client = this.client.getCredentialsClient();
    return await makeRpcRequest<
      ListCredentialsRequestPB,
      ListCredentialsResponsePB,
      ListCredentialsRequest,
      ListCredentialsResponse
    >({
      method: client.listCredentials.bind(client),
      requestPBObjectConstructor: ListCredentialsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", CredentialsPB]]
    });
  }

  async deleteCredentials(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getCredentialsClient();
    return await makeRpcRequest<
      DeleteCredentialsRequestPB,
      DeleteCredentialsResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteCredentials.bind(applicationsClient),
      requestPBObjectConstructor: DeleteCredentialsRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Credentials };
