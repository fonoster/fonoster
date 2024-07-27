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
  CreateTrunkRequest,
  ListTrunksRequest,
  ListTrunksResponse,
  Trunk,
  UpdateTrunkRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateTrunkRequest as CreateTrunkRequestPB,
  CreateTrunkResponse as CreateTrunkResponsePB,
  DeleteTrunkRequest as DeleteTrunkRequestPB,
  DeleteTrunkResponse as DeleteTrunkResponsePB,
  GetTrunkRequest as GetTrunkRequestPB,
  ListTrunksRequest as ListTrunksRequestPB,
  ListTrunksResponse as ListTrunksResponsePB,
  Trunk as TrunkPB,
  UpdateTrunkRequest as UpdateTrunkRequestPB,
  UpdateTrunkResponse as UpdateTrunkResponsePB
} from "./generated/web/trunks_pb";

class Trunks {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createTrunk(request: CreateTrunkRequest): Promise<BaseApiObject> {
    const client = this.client.getTrunksClient();
    return await makeRpcRequest<
      CreateTrunkRequestPB,
      CreateTrunkResponsePB,
      CreateTrunkRequest,
      BaseApiObject
    >({
      method: client.createTrunk.bind(client),
      requestPBObjectConstructor: CreateTrunkRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async getTrunk(ref: string) {
    const client = this.client.getTrunksClient();
    return await makeRpcRequest<
      GetTrunkRequestPB,
      TrunkPB,
      BaseApiObject,
      Trunk
    >({
      method: client.getTrunk.bind(client),
      requestPBObjectConstructor: GetTrunkRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  async updateTrunk(request: UpdateTrunkRequest): Promise<BaseApiObject> {
    const client = this.client.getTrunksClient();
    return await makeRpcRequest<
      UpdateTrunkRequestPB,
      UpdateTrunkResponsePB,
      UpdateTrunkRequest,
      BaseApiObject
    >({
      method: client.updateTrunk.bind(client),
      requestPBObjectConstructor: UpdateTrunkRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async listTrunks(request: ListTrunksRequest): Promise<ListTrunksResponse> {
    const client = this.client.getTrunksClient();
    return await makeRpcRequest<
      ListTrunksRequestPB,
      ListTrunksResponsePB,
      ListTrunksRequest,
      ListTrunksResponse
    >({
      method: client.listTrunks.bind(client),
      requestPBObjectConstructor: ListTrunksRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", TrunkPB]]
    });
  }

  async deleteTrunk(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getTrunksClient();
    return await makeRpcRequest<
      DeleteTrunkRequestPB,
      DeleteTrunkResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteTrunk.bind(applicationsClient),
      requestPBObjectConstructor: DeleteTrunkRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Trunks };
