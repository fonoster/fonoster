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
  CallDetailRecord,
  CallDirection,
  CallStatus,
  CallType,
  CreateCallRequest,
  CreateCallResponse,
  GetCallRequest,
  HangupCause,
  ListCallsRequest,
  ListCallsResponse
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  Call as CallPB,
  CreateCallRequest as CreateCallRequestPB,
  CreateCallResponse as CreateCallResponsePB,
  GetCallRequest as GetCallRequestPB,
  GetCallResponse as GetCallResponsePB,
  ListCallsRequest as ListCallsRequestPB,
  ListCallsResponse as ListCallsResponsePB
} from "./generated/node/calls_pb";

/**
 * @classdesc Fonoster Calls, part of the Fonoster Media subsystem,
 * allows you to create, list, and track calls in your deployment.
 * Note that an active Fonoster deployment is required.
 *
 * @example
 *
 * const SDK = require("@fonoster/sdk");
 *
 * async function main(request) {
 *  const username = "admin";
 *  const password = "yourpassword";
 *  const accessKeyId = "00000000-0000-0000-0000-000000000000";
 *
 *  try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.login({ username, password });
 *
 *     const calls = new SDK.Calls(client);
 *     const response = await apiKeys.createCall(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   from: "8287854037",
 *   to: "+17853178070",
 *   appRef: "00000000-0000-0000-0000-000000000000"
 * };
 *
 * main(request).catch(console.error);
 */
class Calls {
  private client: FonosterClient;
  /**
   * Constructs a new Calls object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createCall(request: CreateCallRequest): Promise<CreateCallResponse> {
    const client = this.client.getCallsClient();

    return await makeRpcRequest<
      CreateCallRequestPB,
      CreateCallResponsePB,
      CreateCallRequest,
      CreateCallResponse
    >({
      method: client.createCall.bind(client),
      requestPBObjectConstructor: CreateCallRequestPB,
      metadata: this.client.getMetadata(),
      request,
      enumMapping: [["type", CallType]]
    });
  }

  /**
   * Retrieves an existing Call in the Workspace.
   *
   * @param {string} ref - The reference of the Call to retrieve
   * @return {Promise<Acl>} - The response object that contains the Call detail
   * @example
   *
   * const ref = "00000000-0000-0000-0000-000000000000"
   *
   * const calls = new SDK.Calls(client); // Existing client object
   *
   * calls.getCall(ref)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
  async getCall(ref: string) {
    const client = this.client.getCallsClient();
    return await makeRpcRequest<
      GetCallRequestPB,
      GetCallResponsePB,
      GetCallRequest,
      CallDetailRecord
    >({
      method: client.getCall.bind(client),
      requestPBObjectConstructor: GetCallRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref },
      enumMapping: [
        ["type", CallType],
        ["callStatus", CallStatus],
        ["hangupCause", HangupCause],
        ["callDirection", CallDirection]
      ]
    });
  }

  /**
   * Retrieves a list of Calls from a Workspace.
   *
   * @param {ListCallsRequest} request - The request object that contains the necessary information to retrieve a list of Calls
   * @param {number} request.pageSize - The number of Calls to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Calls
   * @return {Promise<ListCallsResponse>} - The response object that contains the list of Calls
   * @example
   *
   * const request = {
   *  pageSize: 10,
   *  pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * const calls = new SDK.Calls(client); // Existing client object
   *
   * calls.listCalls(request)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
  async listCalls(request: ListCallsRequest): Promise<ListCallsResponse> {
    const client = this.client.getCallsClient();
    return await makeRpcRequest<
      ListCallsRequestPB,
      ListCallsResponsePB,
      ListCallsRequest,
      ListCallsResponse
    >({
      method: client.listCalls.bind(client),
      requestPBObjectConstructor: ListCallsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", CallPB]]
    });
  }
}

export { Calls };
