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
  CreateNumberRequest,
  INumber,
  ListNumbersRequest,
  ListNumbersResponse,
  UpdateNumberRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateNumberRequest as CreateNumberRequestPB,
  CreateNumberResponse as CreateNumberResponsePB,
  DeleteNumberRequest as DeleteNumberRequestPB,
  DeleteNumberResponse as DeleteNumberResponsePB,
  GetNumberRequest as GetNumberRequestPB,
  ListNumbersRequest as ListNumbersRequestPB,
  ListNumbersResponse as ListNumbersResponsePB,
  Number as NumberPB,
  UpdateNumberRequest as UpdateNumberRequestPB,
  UpdateNumberResponse as UpdateNumberResponsePB
} from "./generated/node/numbers_pb";

/**
 * @classdesc Fonoster Numbers, part of the Fonoster SIP Proxy subsystem,
 * allows you to create, update, retrieve, and delete SIP Number for your deployment.
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
 *     const numbers = new SDK.Numbers(client);
 *     const response = await numbers.createNumber(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "My Number",
 *   telUrl: "tel:+17853178070",
 *   city: "Asheville",
 *   country: "United States",
 *   countryIsoCode: "US"
 * };
 *
 * main(request);
 */
class Numbers {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Numbers object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new Number in the Workspace.
   *
   * @param {CreateNumberRequest} request - The request object that contains the necessary information to create a new Number
   * @param {string} request.name - The name of the Number
   * @param {string} request.telUrl - The telUrl of the Number
   * @param {string} request.city - The city of the Number
   * @param {string} request.country - The country of the Number
   * @param {string} request.countryIsoCode - The countryIsoCode of the Number
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Number
   * @example
   * const numbers = new SDK.Numbers(client); // Existing client object
   *
   * const request = {
   *   name: "My Number",
   *   telUrl: "tel:+17853178070",
   *   city: "Asheville",
   *   country: "United States",
   *   countryIsoCode: "US"
   * };
   *
   * numbers
   *   .createNumber(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async createNumber(request: CreateNumberRequest): Promise<BaseApiObject> {
    const client = this.client.getNumbersClient();
    return await makeRpcRequest<
      CreateNumberRequestPB,
      CreateNumberResponsePB,
      CreateNumberRequest,
      BaseApiObject
    >({
      method: client.createNumber.bind(client),
      requestPBObjectConstructor: CreateNumberRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Retrieves an existing Number in the Workspace.
   *
   * @param {string} ref - The reference of the Number to retrieve
   * @return {Promise<Acl>} - The response object that contains the Number
   * @example
   * const numbers = new SDK.Numbers(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * numbers
   *   .getNumber(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getNumber(ref: string): Promise<INumber> {
    const client = this.client.getNumbersClient();
    const response = await makeRpcRequest<
      GetNumberRequestPB,
      NumberPB,
      BaseApiObject,
      INumber
    >({
      method: client.getNumber.bind(client),
      requestPBObjectConstructor: GetNumberRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });

    const trunk = (
      response?.trunk as unknown as {
        toObject: () => {
          ref: string;
          name: string;
        };
      }
    )?.toObject();

    return response
      ? {
          ...response,
          trunk
        }
      : null;
  }

  /**
   * Updates an existing Number in the Workspace.
   *
   * @param {UpdateNumberRequest} request - The request object that contains the necessary information to update an existing Number
   * @param {string} request.ref - The reference of the Number to update
   * @param {string} request.name - The name of the Number
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Number
   * @example
   * const numbers = new SDK.Numbers(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "My Number"
   * };
   *
   * numbers
   *   .updateNumber(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async updateNumber(request: UpdateNumberRequest): Promise<BaseApiObject> {
    const client = this.client.getNumbersClient();
    return await makeRpcRequest<
      UpdateNumberRequestPB,
      UpdateNumberResponsePB,
      UpdateNumberRequest,
      BaseApiObject
    >({
      method: client.updateNumber.bind(client),
      requestPBObjectConstructor: UpdateNumberRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Retrieves a list of Numbers from a Workspace.
   *
   * @param {ListNumbersRequest} request - The request object that contains the necessary information to retrieve a list of Numbers
   * @param {number} request.pageSize - The number of Numbers to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Numbers
   * @return {Promise<ListNumbersResponse>} - The response object that contains the list of Numbers
   * @example
   * const numbers = new SDK.Numbers(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * numbers
   *   .listNumbers(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async listNumbers(request: ListNumbersRequest): Promise<ListNumbersResponse> {
    const client = this.client.getNumbersClient();
    return await makeRpcRequest<
      ListNumbersRequestPB,
      ListNumbersResponsePB,
      ListNumbersRequest,
      ListNumbersResponse
    >({
      method: client.listNumbers.bind(client),
      requestPBObjectConstructor: ListNumbersRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", NumberPB]]
    });
  }

  /**
   * Deletes an existing Number from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Number to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Number
   * @example
   * const numbers = new SDK.Numbers(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * numbers
   *   .deleteNumber(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async deleteNumber(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getNumbersClient();
    return await makeRpcRequest<
      DeleteNumberRequestPB,
      DeleteNumberResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteNumber.bind(applicationsClient),
      requestPBObjectConstructor: DeleteNumberRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Numbers };
