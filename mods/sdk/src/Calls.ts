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
} from "@fonoster/common";
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

class Calls {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createCall(request: CreateCallRequest): Promise<CreateCallResponse> {
    const CallsClient = this.client.getCallsClient();

    return await makeRpcRequest<
      CreateCallRequestPB,
      CreateCallResponsePB,
      CreateCallRequest,
      CreateCallResponse
    >({
      method: CallsClient.createCall.bind(CallsClient),
      requestPBObjectConstructor: CreateCallRequestPB,
      metadata: this.client.getMetadata(),
      request,
      enumMapping: [["type", CallType]]
    });
  }

  async getCall(ref: string) {
    const CallsClient = this.client.getCallsClient();
    return await makeRpcRequest<
      GetCallRequestPB,
      GetCallResponsePB,
      GetCallRequest,
      CallDetailRecord
    >({
      method: CallsClient.getCall.bind(CallsClient),
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

  async listCalls(request: ListCallsRequest): Promise<ListCallsResponse> {
    const CallsClient = this.client.getCallsClient();
    return await makeRpcRequest<
      ListCallsRequestPB,
      ListCallsResponsePB,
      ListCallsRequest,
      ListCallsResponse
    >({
      method: CallsClient.listCalls.bind(CallsClient),
      requestPBObjectConstructor: ListCallsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", CallPB]]
    });
  }
}

export { Calls };
