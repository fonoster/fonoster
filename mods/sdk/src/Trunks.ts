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
  UpdateTrunkRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateTrunkRequest as CreateTrunkRequestPB,
  DeleteTrunkRequest as DeleteTrunkRequestPB,
  DeleteTrunkResponse as DeleteTrunkResponsePB,
  GetTrunkRequest as GetTrunkRequestPB,
  ListTrunksRequest as ListTrunksRequestPB,
  UpdateTrunkRequest as UpdateTrunkRequestPB
} from "./generated/node/trunks_pb";

class Trunks {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createTrunk(request: CreateTrunkRequest): Promise<BaseApiObject> {
    const client = this.client.getTrunksClient();
    const createTrunkRequest = new CreateTrunkRequestPB();
    createTrunkRequest.setName(request.name);
    createTrunkRequest.setInboundUri(request.inboundUri);
    createTrunkRequest.setSendRegister(request.sendRegister);
    // createAclRequest.setAccessControlListRef(?);
    // createAclRequest.setInboundCredentialsRef(?);
    // createAclRequest.setOutboundCredentialsRef(?);
    // request.uris.forEach(uri => {
    //   const uri = new CreateTrunkRequestPB.Uris();
    //   createTrunkRequest.addUris(uri);
    // }

    return new Promise((resolve, reject) => {
      client.createTrunk(
        createTrunkRequest,
        this.client.getMetadata(),
        (err, response) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(response.toObject());
        }
      );
    });
  }

  async getTrunk(ref: string) {
    const client = this.client.getTrunksClient();
    const getTrunkRequest = new GetTrunkRequestPB();
    getTrunkRequest.setRef(ref);

    return new Promise((resolve, reject) => {
      client.getTrunk(
        getTrunkRequest,
        this.client.getMetadata(),
        (err, response) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(response.toObject());
        }
      );
    });
  }

  async updateTrunk(request: UpdateTrunkRequest): Promise<BaseApiObject> {
    const client = this.client.getTrunksClient();
    const updateTrunkRequest = new UpdateTrunkRequestPB();
    updateTrunkRequest.setRef(request.ref);
    updateTrunkRequest.setName(request.name);
    updateTrunkRequest.setSendRegister(request.sendRegister);
    // updateAclRequest.setAccessControlListRef(?);
    // updateAclRequest.setInboundCredentialsRef(?);
    // updateAclRequest.setOutboundCredentialsRef(?);
    // request.uris.forEach(uri => {
    //   const uri = new UpdateTrunkRequestPB.Uris();
    //   updateTrunkRequest.addUris(uri);
    // }
    return new Promise((resolve, reject) => {
      client.updateTrunk(
        updateTrunkRequest,
        this.client.getMetadata(),
        (err, response) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(response.toObject());
        }
      );
    });
  }

  async listTrunks(request: ListTrunksRequest): Promise<ListTrunksResponse> {
    const client = this.client.getTrunksClient();
    const listTrunksRequest = new ListTrunksRequestPB();
    listTrunksRequest.setPageSize(request.pageSize);
    listTrunksRequest.setPageToken(request.pageToken);

    return new Promise((resolve, reject) => {
      client.listTrunks(
        listTrunksRequest,
        this.client.getMetadata(),
        (err, response) => {
          if (err) {
            reject(err);
            return;
          }

          const items = response.getItemsList().map((item) => {
            const obj = item.toObject();
            return {
              ...obj
            };
          });

          resolve({
            items: items as any,
            nextPageToken: response.getNextPageToken()
          });
        }
      );
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
