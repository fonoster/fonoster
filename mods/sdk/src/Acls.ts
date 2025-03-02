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
  CreateAclRequest as CreateAclRequestPB,
  DeleteAclRequest as DeleteAclRequestPB,
  DeleteAclResponse as DeleteAclResponsePB,
  GetAclRequest as GetAclRequestPB,
  ListAclsRequest as ListAclsRequestPB,
  UpdateAclRequest as UpdateAclRequestPB
} from "./generated/node/acls_pb";

/**
 * @classdesc Fonoster Acls, part of the Fonoster SIP Proxy subsystem,
 * allows you to create, update, retrieve, and delete Access Control Lists (ACLs) rules for your deployment.
 * Note that an active Fonoster deployment is required.
 *
 * @example
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
 *     const acls = new SDK.Acls(client);
 *     const response = await acls.createAcl(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "My ACL",
 *   allow: ["47.132.130.31"] // Allow only this IP
 * };
 *
 * main(request);
 */
class Acls {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Acls object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new Acl in the Workspace.
   *
   * @param {CreateAclRequest} request - The request object that contains the necessary information to create a new Acl
   * @param {string} request.name - The name of the Acl
   * @param {string[]} request.allow - The list of IPs to allow
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Acl
   * @example
   * const acls = new SDK.Acls(client); // Existing client object
   *
   * const request = {
   *   name: "My ACL",
   *   allow: ["47.132.130.31"] // Allow only this IP
   * };
   *
   * acls
   *   .createAcl(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async createAcl(request: CreateAclRequest): Promise<BaseApiObject> {
    const client = this.client.getAclsClient();
    const createAclRequest = new CreateAclRequestPB();
    createAclRequest.setName(request.name);
    createAclRequest.setAllowList(request.allow);

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

  /**
   * Retrieves an existing Acl in the Workspace.
   *
   * @param {string} ref - The reference of the Acl to retrieve
   * @return {Promise<Acl>} - The response object that contains the Acl information
   * @example
   * const acls = new SDK.Acls(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * acls
   *   .getAcl(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getAcl(ref: string): Promise<Acl> {
    const updateAclRequest = new GetAclRequestPB();
    updateAclRequest.setRef(ref);
    const client = this.client.getAclsClient();

    return new Promise((resolve, reject) => {
      client.getAcl(
        updateAclRequest,
        this.client.getMetadata(),
        (err, response) => {
          if (err) {
            reject(err);
            return;
          }

          const obj = response.toObject();
          resolve({
            ...obj,
            allow: obj.allowList,
            createdAt: new Date(obj.createdAt * 1000),
            updatedAt: new Date(obj.updatedAt * 1000)
          });
        }
      );
    });
  }

  /**
   * Updates an existing Acl in the Workspace.
   *
   * @param {UpdateAclRequest} request - The request object that contains the necessary information to update an existing Acl
   * @param {string} request.ref - The reference of the Acl to update
   * @param {string} request.name - The name of the Acl
   * @param {string[]} request.allow - The list of IPs to allow
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Acl
   * @example
   * const acls = new SDK.Acls(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "My ACL",
   *   allow: ["47.132.130.31"] // Allow only this IP
   * };
   *
   * acls
   *   .updateAcl(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async updateAcl(request: UpdateAclRequest): Promise<BaseApiObject> {
    const client = this.client.getAclsClient();
    const updateAclRequest = new UpdateAclRequestPB();
    updateAclRequest.setRef(request.ref);
    updateAclRequest.setName(request.name);
    updateAclRequest.setAllowList(request.allow);

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

  /**
   * Retrieves a list of Acls from a Workspace.
   *
   * @param {ListAclsRequest} request - The request object that contains the necessary information to retrieve a list of Acls
   * @param {number} request.pageSize - The number of Acls to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Acls
   * @return {Promise<ListAclsResponse>} - The response object that contains the list of Acls
   * @example
   * const acls = new SDK.Acls(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * acls
   *   .listAcls(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
              createdAt: new Date(obj.createdAt * 1000),
              updatedAt: new Date(obj.updatedAt * 1000)
            };
          });

          resolve({
            items: items as unknown as Acl[],
            nextPageToken: response.getNextPageToken()
          });
        }
      );
    });
  }

  /**
   * Deletes an existing Acl from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Acl to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Acl
   * @example
   * const acls = new SDK.Acls(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * acls
   *   .deleteAcl(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async deleteAcl(ref: string): Promise<BaseApiObject> {
    const client = this.client.getAclsClient();
    return await makeRpcRequest<
      DeleteAclRequestPB,
      DeleteAclResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: client.deleteAcl.bind(client),
      requestPBObjectConstructor: DeleteAclRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Acls };
