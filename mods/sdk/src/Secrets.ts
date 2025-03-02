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

/**
 * @classdesc Fonoster Secrets, part of the Fonoster Core,
 * allows you to create, update, retrieve, and delete Secrets for your deployment.
 * Note that an active Fonoster deployment is required.
 *
 * @example
 *
 * const SDK = require("@fonoster/sdk");
 *
 * async function main(request) {
 *   const apiKey = "your-api-key";
 *   const apiSecret = "your-api-secret"
 *   const accessKeyId = "WO00000000000000000000000000000000";
 *
 *   try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.loginWithApiKey(apiKey, apiSecret);
 *
 *     const secrets = new SDK.Secrets(client);
 *     const response = await secrets.creteSecret(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "FRIENDLY_NAME",
 *   secret: "mysecret"
 * };
 *
 * main(request);
 */
class Secrets {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Secrets object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new Secret in the Workspace.
   *
   * @param {CreateSecretRequest} request - The request object that contains the necessary information to create a new Secret
   * @param {string} request.name - The name of the Secret
   * @param {string} request.secret - The secret of the Secret
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Secret
   * @example
   * const secrets = new SDK.Secrets(client); // Existing client object
   *
   * const request = {
   *   name: "FRIENDLY_NAME",
   *   secret: "mysecret"
   * };
   *
   * secrets
   *   .createSecret(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Retrieves an existing Secret in the Workspace.
   *
   * @param {string} ref - The reference of the Secret to retrieve
   * @return {Promise<Acl>} - The response object that contains the Secret
   * @example
   * const secrets = new SDK.Secrets(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * secrets
   *   .getSecret(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Updates an existing Secret in the Workspace.
   *
   * @param {UpdateSecretRequest} request - The request object that contains the necessary information to update an existing Secret
   * @param {string} request.ref - The reference of the Secret to update
   * @param {string} request.name - The name of the Secret
   * @param {string} request.secret - The secret of the Secret
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Secret
   * @example
   * const secrets = new SDK.Secrets(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   secret: "mysecret"
   * };
   *
   * secrets
   *   .updateSecret(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Retrieves a list of Secrets from a Workspace.
   *
   * @param {ListSecretsRequest} request - The request object that contains the necessary information to retrieve a list of Secrets
   * @param {number} request.pageSize - The secret of Secrets to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Secrets
   * @return {Promise<ListSecretsResponse>} - The response object that contains the list of Secrets
   * @example
   * const secrets = new SDK.Secrets(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * secrets
   *   .listSecrets(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Deletes an existing Secret from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Secret to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Secret
   * @example
   * const secrets = new SDK.Secrets(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * secrets
   *   .deleteSecret(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
