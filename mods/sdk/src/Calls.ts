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
import { DialStatus } from "@fonoster/common";
import {
  BaseApiObject,
  CallDetailRecord,
  CreateCallRequest,
  ListCallsRequest,
  ListCallsResponse
} from "@fonoster/types";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { DataResponse, FonosterClient } from "./client/types";
import {
  CallDirection,
  Call as CallPB,
  CallStatus,
  CallType,
  CreateCallRequest as CreateCallRequestPB,
  CreateCallResponse as CreateCallResponsePB,
  GetCallRequest as GetCallRequestPB,
  GetCallResponse as GetCallResponsePB,
  ListCallsRequest as ListCallsRequestPB,
  ListCallsResponse as ListCallsResponsePB,
  TrackCallRequest as TrackCallRequestPB
} from "./generated/node/calls_pb";
import { dialStatusToString } from "./utils";

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
 *   const apiKey = "your-api-key";
 *   const apiSecret = "your-api-secret"
 *   const accessKeyId = "WO00000000000000000000000000000000";
 *
 *   try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.loginWithApiKey(apiKey, apiSecret);
 *
 *     const calls = new SDK.Calls(client);
 *     const response = await calls.createCall(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   from: "+18287854037",
 *   to: "+17853178070",
 *   appRef: "00000000-0000-0000-0000-000000000000"
 * };
 *
 * main(request);
 */
class Calls {
  private readonly client: FonosterClient;
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

  /**
   * Creates a new Call in the Workspace.
   *
   * @param {CreateCallRequest} request - The request object that contains the necessary information to create a new Call
   * @param {string} request.from - The number that originated the call
   * @param {string} request.to - The number that received the call
   * @param {string} request.appRef - The reference of the App that will handle the call
   * @param {number} request.timeout - The time in seconds to wait for the call to be answered. Default is 60 seconds
   * @param {Record<string, string>} request.metadata - Optional metadata to be sent to the App. For Autopilot applications, this is added to the context of the conversation.
   * @return {{ref: string, statusStream: AsyncGenerator<{ status: DialStatus }>}} - The response object that contains the Call reference and a stream of status updates
   * @see DialStatus
   * @example
   * const calls = new SDK.Calls(client); // Existing client object
   *
   * const request = {
   *   from: "+18287854037",
   *   to: "+17853178070",
   *   appRef: "00000000-0000-0000-0000-000000000000",
   *   timeout: 30,
   *   metadata: {
   *     "name": "John Doe",
   *     "preferredLanguage": "en-US"
   *   }
   * };
   *
   * const response = await calls.createCall(request);
   * const { ref, statusStream } = response;
   *
   * console.log(ref); // Call reference
   *
   * for await (const status of statusStream) {
   *  console.log(status); // Streamed status
   * }
   */
  async createCall(request: CreateCallRequest): Promise<{
    ref: string;
    statusStream: AsyncGenerator<{ status: DialStatus }>;
  }> {
    const client = this.client.getCallsClient();

    const response = await makeRpcRequest<
      CreateCallRequestPB,
      CreateCallResponsePB,
      CreateCallRequest,
      BaseApiObject
    >({
      method: client.createCall.bind(client),
      requestPBObjectConstructor: CreateCallRequestPB,
      metadata: this.client.getMetadata(),
      request: {
        ...request,
        metadata: Struct.fromJavaScript(request.metadata) as unknown as Record<
          string,
          unknown
        >
      }
    });

    const trackCallRequest = new TrackCallRequestPB();
    trackCallRequest.setRef(response.ref);

    const call = client.trackCall(trackCallRequest, this.client.getMetadata());

    async function* statusStreamGenerator(): AsyncGenerator<{
      status: DialStatus;
    }> {
      const queue: Array<{ status: number }> = [];
      let done = false;

      call.on("data", (response: DataResponse) => {
        const data = response.toObject();
        queue.push(data as { status: number });
      });

      call.on("end", () => {
        done = true;
      });

      call.on("error", () => {
        done = true;
        throw new Error("An error occurred while tracking the call");
      });

      // eslint-disable-next-line no-loops/no-loops
      while (!done) {
        if (queue.length > 0) {
          const data = queue.shift()!;
          if (!data) {
            return;
          }

          yield { status: dialStatusToString(data.status) } as {
            status: DialStatus;
          };
        } else {
          await new Promise<void>((resolve) => setTimeout(resolve, 50));
        }
      }
    }

    const statusStream = statusStreamGenerator();

    return { ref: response.ref, statusStream };
  }

  /**
   * Retrieves an existing Call in the Workspace.
   *
   * @param {string} ref - The reference of the Call to retrieve
   * @return {Promise<CallDetailRecord>} - The response object that contains the Call detail
   * @example
   * const calls = new SDK.Calls(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * calls
   *   .getCall(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getCall(ref: string) {
    const client = this.client.getCallsClient();
    return await makeRpcRequest<
      GetCallRequestPB,
      GetCallResponsePB,
      BaseApiObject,
      CallDetailRecord
    >({
      method: client.getCall.bind(client),
      requestPBObjectConstructor: GetCallRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref },
      enumMapping: [
        ["type", CallType],
        ["status", CallStatus],
        ["direction", CallDirection]
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
   * const calls = new SDK.Calls(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * calls
   *   .listCalls(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
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
      enumMapping: [
        ["type", CallType],
        ["status", CallStatus],
        ["direction", CallDirection]
      ],
      repeatableObjectMapping: [["itemsList", CallPB]]
    });
  }
}

export { Calls };
