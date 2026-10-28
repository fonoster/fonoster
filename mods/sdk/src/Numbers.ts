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
  LinkTwilioNumberRequest,
  LinkTwilioNumberResponse,
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
  LinkTwilioNumberRequest as LinkTwilioNumberRequestPB,
  LinkTwilioNumberResponse as LinkTwilioNumberResponsePB,
  ListNumbersRequest as ListNumbersRequestPB,
  ListNumbersResponse as ListNumbersResponsePB,
  Number as NumberPB,
  TwilioCredentials as TwilioCredentialsPB,
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

    // The trunk comes back as a plain object (objectToJson).
    return response ?? null;
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

  /**
   * Links a number from your Twilio account to the Workspace, so it rings an Application or
   * a SIP agent. It provisions the number's Twilio trunk, creates or updates the Fonoster
   * Number and its "Twilio Trunk", and moves the number to that trunk in Twilio. Calling it
   * again with the same number converges instead of duplicating. The Twilio credentials are
   * used for this request and not stored.
   *
   * @param {LinkTwilioNumberRequest} request - The request object that contains the necessary information to link a Twilio number
   * @param {string} request.phoneNumber - The number in E.164; it must be in the Twilio account
   * @param {string} request.name - The name of the Number (optional; defaults to the phoneNumber)
   * @param {string} request.appRef - The Application that answers the number (or agentAor)
   * @param {string} request.agentAor - The SIP agent that answers the number (or appRef)
   * @param {TwilioCredentials} request.credentials - The Twilio Account SID with a Standard API key (apiKeySid and apiKeySecret) or the Auth Token (authToken)
   * @return {Promise<LinkTwilioNumberResponse>} - The response object that contains the reference to the Number and to its Trunk
   * @example
   * const numbers = new SDK.Numbers(client); // Existing client object
   *
   * const request = {
   *   phoneNumber: "+18095550123",
   *   name: "Front desk",
   *   appRef: "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00",
   *   credentials: {
   *     accountSid: "AC0123456789abcdef0123456789abcdef",
   *     apiKeySid: "SK0123456789abcdef0123456789abcdef",
   *     apiKeySecret: process.env.TWILIO_API_KEY_SECRET
   *   }
   * };
   *
   * numbers
   *   .linkTwilioNumber(request)
   *   .then(console.log) // successful response: { ref, trunkRef }
   *   .catch(console.error); // an error occurred
   */
  async linkTwilioNumber(
    request: LinkTwilioNumberRequest
  ): Promise<LinkTwilioNumberResponse> {
    const client = this.client.getNumbersClient();
    return await makeRpcRequest<
      LinkTwilioNumberRequestPB,
      LinkTwilioNumberResponsePB,
      LinkTwilioNumberRequest,
      LinkTwilioNumberResponse
    >({
      method: client.linkTwilioNumber.bind(client),
      requestPBObjectConstructor: LinkTwilioNumberRequestPB,
      metadata: this.client.getMetadata(),
      request,
      objectMapping: [["credentials", TwilioCredentialsPB]]
    });
  }
}

export { Numbers };
