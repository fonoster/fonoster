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

/**
 * @classdesc Fonoster Credentials, part of the Fonoster SIP Proxy subsystem,
 * allows you to create, update, retrieve, and delete SIP Credentials for your deployment.
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
 *     const credentials = new SDK.Credentials(client);
 *     const response = await apiKeys.createCredentials(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "My Credentials",
 *   username: "myusername",
 *   password: "mysecret"
 * };
 *
 * main(request);
 */
class Credentials {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Credentials object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new set of Credentials in the Workspace.
   *
   * @param {CreateCredentialsRequest} request - The request object that contains the necessary information to create a new set of Credentials
   * @param {string} request.name - The name of the Credentials
   * @param {string} request.username - The username of the Credentials
   * @param {string} request.password - The password of the Credentials
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Credentials
   * @example
   * const credentials = new SDK.Credentials(client); // Existing client object
   *
   * const request = {
   *   name: "My Credentials",
   *   username: "myusername",
   *   password: "mysecret"
   * };
   *
   * credentials
   *   .createCredentials(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Retrieves an existing set of Credentials in the Workspace.
   *
   * @param {string} ref - The reference of the Credentials to retrieve
   * @return {Promise<Acl>} - The response object that contains the Credentials
   * @example
   * const credentials = new SDK.Credentials(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * credentials
   *   .getCredentials(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getCredentials(ref: string): Promise<CredentialsType> {
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

  /**
   * Updates an existing set of Credentials in the Workspace.
   *
   * @param {UpdateCredentialsRequest} request - The request object that contains the necessary information to update an existing set of Credentials
   * @param {string} request.ref - The reference of the Credentials to update
   * @param {string} request.name - The name of the Credentials
   * @param {string} request.password - The password of the Credentials
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Credentials
   * @example
   * const credentials = new SDK.Credentials(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "My Credentials",
   *   password: "mysecret"
   * };
   *
   * credentials
   *    .updateCredentials(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Retrieves a list of Credentials from a Workspace.
   *
   * @param {ListCredentialsRequest} request - The request object that contains the necessary information to retrieve a list of Credentials
   * @param {number} request.pageSize - The number of Credentials to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Credentials
   * @return {Promise<ListCredentialsResponse>} - The response object that contains the list of Credentials
   * @example
   * const credentials = new SDK.Credentials(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * credentials
   *   .listCredentials(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Deletes an existing set of Credentials from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Credentials to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Credentials
   * @example
   * const credentials = new SDK.Credentials(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * credentials
   *   .deleteCredentials(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
