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
  Acl,
  BaseApiObject,
  CreateAclRequest,
  ListAclsRequest,
  ListAclsResponse,
  UpdateAclRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  Acl as AclPB,
  CreateAclRequest as CreateAclRequestPB,
  DeleteAclRequest as DeleteAclRequestPB,
  DeleteAclResponse as DeleteAclResponsePB,
  GetAclRequest as GetAclRequestPB,
  ListAclsRequest as ListAclsRequestPB,
  UpdateAclRequest as UpdateAclRequestPB
} from "./generated/node/acls_pb";

class Acls {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createAcl(request: CreateAclRequest): Promise<BaseApiObject> {
    const client = this.client.getAclsClient();
    const createAclRequest = new CreateAclRequestPB();
    createAclRequest.setName(request.name);
    createAclRequest.setAllowList(request.allow);
    createAclRequest.setDenyList(request.deny);

    return new Promise((resolve, reject) => {
      client.createAcl(
        createAclRequest,
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

  async getAcl(ref: string) {
    const client = this.client.getAclsClient();
    return await makeRpcRequest<GetAclRequestPB, AclPB, BaseApiObject, Acl>({
      method: client.getAcl.bind(client),
      requestPBObjectConstructor: GetAclRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  async updateAcl(request: UpdateAclRequest): Promise<BaseApiObject> {
    const client = this.client.getAclsClient();
    const updateAclRequest = new UpdateAclRequestPB();
    updateAclRequest.setRef(request.ref);
    updateAclRequest.setName(request.name);
    updateAclRequest.setAllowList(request.allow);
    updateAclRequest.setDenyList(request.deny);

    return new Promise((resolve, reject) => {
      client.updateAcl(
        updateAclRequest,
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

  async listAcls(request: ListAclsRequest): Promise<ListAclsResponse> {
    const client = this.client.getAclsClient();
    const listAclsRequest = new ListAclsRequestPB();
    listAclsRequest.setPageSize(request.pageSize);
    listAclsRequest.setPageToken(request.pageToken);

    return new Promise((resolve, reject) => {
      client.listAcls(
        listAclsRequest,
        this.client.getMetadata(),
        (err, response) => {
          if (err) {
            reject(err);
            return;
          }

          const items = response.getItemsList().map((item) => {
            const obj = item.toObject();
            return {
              ...obj,
              allow: obj.allowList,
              deny: obj.denyList
            };
          });

          resolve({
            items,
            nextPageToken: response.getNextPageToken()
          });
        }
      );
    });
  }

  async deleteAcl(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getAclsClient();
    return await makeRpcRequest<
      DeleteAclRequestPB,
      DeleteAclResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteAcl.bind(applicationsClient),
      requestPBObjectConstructor: DeleteAclRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Acls };
