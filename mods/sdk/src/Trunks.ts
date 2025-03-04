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
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  DeleteTrunkRequest as DeleteTrunkRequestPB,
  DeleteTrunkResponse as DeleteTrunkResponsePB,
  GetTrunkRequest as GetTrunkRequestPB,
  ListTrunksRequest as ListTrunksRequestPB,
  TrunkURI,
  UpdateTrunkRequest as UpdateTrunkRequestPB
} from "./generated/node/trunks_pb";

/**
 * @classdesc Fonoster Trunks, part of the Fonoster SIP Proxy subsystem,
 * allows you to create, update, retrieve, and delete SIP Trunks for your deployment.
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
 *     const trunks = new SDK.Trunks(client);
 *     const response = await trunks.createTrunk(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "My Trunk",
 *   inboundUri: "sip.company.fonoster.io"
 * };
 *
 * main(request);
 */
class Trunks {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Trunks object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new Trunk in the Workspace.
   *
   * @param {CreateTrunkRequest} request - The request object that contains the necessary information to create a new Trunk
   * @param {string} request.name - The name of the Trunk
   * @param {string} request.inboundUri - The inboundUri of the Trunk
   * @param {boolean} request.sendRegister - The sendRegister of the Trunk
   * @param {string} request.accessControlListRef - The accessControlListRef of the Trunk
   * @param {string} request.inboundCredentialsRef - The inboundCredentialsRef of the Trunk
   * @param {string} request.outboundCredentialsRef - The outboundCredentialsRef of the Trunk
   * @param {TrunkUri[]} request.uris - The uris of the Trunk
   * @param {string} request.uris[].host - The host of the Trunk
   * @param {number} request.uris[].port - The port of the Trunk
   * @param {Transport} request.uris[].transport - The transport of the Trunk
   * @param {string} request.uris[].user - Optional user of the Trunk
   * @param {number} request.uris[].weight - Optional weight of the Trunk
   * @param {number} request.uris[].priority - Optional priority of the Trunk
   * @param {boolean} request.uris[].enabled - Optional enabled of the Trunk
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Trunk
   * @example
   * const trunks = new SDK.Trunks(client); // Existing client object
   *
   * const request = {
   *   name: "My Trunk",
   *   inboundUri: "sip.company.fonoster.io"
   *   sendRegister: true
   *   uris: [{
   *     host: "sip.company.fonoster.io",
   *     port: 5060,
   *     transport: "UDP",
   *     user: "user",
   *     weight: 0,
   *     priority: 0,
   *     enabled: true
   *   }]
   * };
   *
   * trunks
   *   .createTrunk(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async createTrunk(request: CreateTrunkRequest): Promise<BaseApiObject> {
    const client = this.client.getTrunksClient();
    const createTrunkRequest = new CreateTrunkRequestPB();
    createTrunkRequest.setName(request.name);
    createTrunkRequest.setInboundUri(request.inboundUri);
    createTrunkRequest.setSendRegister(request.sendRegister);
    createTrunkRequest.setAccessControlListRef(request.accessControlListRef);
    createTrunkRequest.setInboundCredentialsRef(request.inboundCredentialsRef);
    createTrunkRequest.setOutboundCredentialsRef(
      request.outboundCredentialsRef
    );
    request.uris?.forEach((uri) => {
      const current = new TrunkURI();
      current.setHost(uri.host);
      current.setPort(uri.port);
      current.setTransport(uri.transport);
      current.setUser(uri.user);
      current.setWeight(uri.weight);
      current.setPriority(uri.priority);
      current.setEnabled(uri.enabled);
      createTrunkRequest.addUris(current);
    });

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

  /**
   * Retrieves an existing Trunk in the Workspace.
   *
   * @param {string} ref - The reference of the Trunk to retrieve
   * @return {Promise<Acl>} - The response object that contains the Trunk
   * @example
   * const trunks = new SDK.Trunks(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * trunks
   *   .getTrunk(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async getTrunk(ref: string): Promise<Trunk> {
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

          const obj = response.toObject();
          const outObj = {
            ...obj,
            accessControlListRef: obj.accessControlList?.ref,
            inboundCredentialsRef: obj.inboundCredentials?.ref,
            outboundCredentialsRef: obj.outboundCredentials?.ref,
            uris: obj.urisList,
            createdAt: new Date(obj.createdAt * 1000),
            updatedAt: new Date(obj.updatedAt * 1000)
          };
          const {
            urisList,
            accessControlList,
            inboundCredentials,
            outboundCredentials,
            ...rest
          } = outObj;
          resolve(rest as unknown as Trunk);
        }
      );
    });
  }

  /**
   * Updates an existing Trunk in the Workspace.
   *
   * @param {UpdateTrunkRequest} request - The request object that contains the necessary information to update an existing Trunk
   * @param {string} request.ref - The reference of the Trunk to update
   * @param {string} request.name - The name of the Trunk
   * @param {boolean} request.sendRegister - The sendRegister of the Trunk
   * @param {string} request.accessControlListRef - The accessControlListRef of the Trunk
   * @param {string} request.inboundCredentialsRef - The inboundCredentialsRef of the Trunk
   * @param {string} request.outboundCredentialsRef - The outboundCredentialsRef of the Trunk
   * @param {TrunkUri[]} request.uris - The uris of the Trunk
   * @param {string} request.uris[].host - The host of the Trunk
   * @param {number} request.uris[].port - The port of the Trunk
   * @param {Transport} request.uris[].transport - The transport of the Trunk
   * @param {string} request.uris[].user - Optional user of the Trunk
   * @param {number} request.uris[].weight - Optional weight of the Trunk
   * @param {number} request.uris[].priority - Optional priority of the Trunk
   * @param {boolean} request.uris[].enabled - Optional enabled of the Trunk
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Trunk
   * @example
   * const trunks = new SDK.Trunks(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "My Trunk",
   *   sendRegister: true
   *   uris: [{
   *     host: "sip.company.fonoster.io",
   *     port: 5060,
   *     transport: "UDP",
   *     user: "user",
   *     weight: 0,
   *     priority: 0,
   *     enabled: true
   *   }]
   * };
   *
   * trunks
   *   .updateTrunk(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async updateTrunk(request: UpdateTrunkRequest): Promise<BaseApiObject> {
    const client = this.client.getTrunksClient();
    const updateTrunkRequest = new UpdateTrunkRequestPB();
    updateTrunkRequest.setRef(request.ref);
    updateTrunkRequest.setName(request.name);
    updateTrunkRequest.setInboundUri(request.inboundUri);
    updateTrunkRequest.setSendRegister(request.sendRegister);
    updateTrunkRequest.setAccessControlListRef(request.accessControlListRef);
    updateTrunkRequest.setInboundCredentialsRef(request.inboundCredentialsRef);
    updateTrunkRequest.setOutboundCredentialsRef(
      request.outboundCredentialsRef
    );
    request.uris?.forEach((uri) => {
      const current = new TrunkURI();
      current.setHost(uri.host);
      current.setPort(uri.port);
      current.setTransport(uri.transport);
      current.setUser(uri.user);
      current.setWeight(uri.weight);
      current.setPriority(uri.priority);
      current.setEnabled(uri.enabled);
      updateTrunkRequest.addUris(current);
    });

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

  /**
   * Retrieves a list of Trunks from a Workspace.
   *
   * @param {ListTrunksRequest} request - The request object that contains the necessary information to retrieve a list of Trunks
   * @param {number} request.pageSize - The trunk of Trunks to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Trunks
   * @return {Promise<ListTrunksResponse>} - The response object that contains the list of Trunks
   * @example
   * const trunks = new SDK.Trunks(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * trunks
   *   .listTrunks(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
            const outObj = {
              ...obj,
              uris: obj.urisList,
              createdAt: new Date(obj.createdAt * 1000),
              updatedAt: new Date(obj.updatedAt * 1000)
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { urisList, ...rest } = outObj;
            return rest;
          });

          resolve({
            items: items as unknown as Trunk[],
            nextPageToken: response.getNextPageToken()
          });
        }
      );
    });
  }

  /**
   * Deletes an existing Trunk from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Trunk to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Trunk
   * @example
   * const trunks = new SDK.Trunks(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * trunks
   *    .deleteTrunk(ref)
   *    .then(console.log) // successful response
   *    .catch(console.error); // an error occurred
   */
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
