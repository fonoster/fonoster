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

class Numbers {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

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

  async getNumber(ref: string) {
    const client = this.client.getNumbersClient();
    return await makeRpcRequest<
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
  }

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
