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
  CreateDomainRequest,
  Domain,
  ListDomainsRequest,
  ListDomainsResponse,
  UpdateDomainRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateDomainRequest as CreateDomainRequestPB,
  CreateDomainResponse as CreateDomainResponsePB,
  DeleteDomainRequest as DeleteDomainRequestPB,
  DeleteDomainResponse as DeleteDomainResponsePB,
  Domain as DomainPB,
  GetDomainRequest as GetDomainRequestPB,
  ListDomainsRequest as ListDomainsRequestPB,
  ListDomainsResponse as ListDomainsResponsePB,
  UpdateDomainRequest as UpdateDomainRequestPB,
  UpdateDomainResponse as UpdateDomainResponsePB
} from "./generated/node/domains_pb";

/**
 * @classdesc Fonoster Domains, part of the Fonoster SIP Proxy subsystem,
 * allows you to create, update, retrieve, and delete SIP Domain for your deployment.
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
 *     const domains = new SDK.Domains(client);
 *     const response = await domains.createDomain(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "My Domain",
 *   domainUri: "sip.project.fonoster.io"
 * };
 *
 * main(request);
 */
class Domains {
  private readonly client: FonosterClient;
  /**
   * Constructs a new Domains object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
  constructor(client: FonosterClient) {
    this.client = client;
  }

  /**
   * Creates a new Domain in the Workspace.
   *
   * @param {CreateDomainRequest} request - The request object that contains the necessary information to create a new Domain
   * @param {string} request.name - The name of the Domain
   * @param {string} request.domainUri - The URI of the Domain
   * @param {string} request.accessControlListRef - The reference to the Access Control List (ACL) to associate with the Domain
   * @param {EgressPolicy[]} request.egressPolicies - The egress policy of the Domain
   * @param {string} request.egressPolicies[].rule - A regular expression that defines which calls to send to the PSTN
   * @param {string} request.egressPolicies[].numberRef - The Number that will be used to send the call to the PSTN
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Domain
   * @example
   * const domains = new SDK.Domains(client); // Existing client object
   *
   * const request = {
   *   name: "My Domain",
   *   domainUri: "sip.project.fonoster.io",
   *   accessControlListRef: "00000000-0000-0000-0000-000000000001",
   *   egressPolicies: [
   *     {
   *       rule: ".*",
   *       numberRef: "00000000-0000-0000-0000-000000000002"
   *     }
   *   ]
   * };
   *
   * domains
   *   .createDomain(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async createDomain(request: CreateDomainRequest): Promise<BaseApiObject> {
    const client = this.client.getDomainsClient();
    return await makeRpcRequest<
      CreateDomainRequestPB,
      CreateDomainResponsePB,
      CreateDomainRequest,
      BaseApiObject
    >({
      method: client.createDomain.bind(client),
      requestPBObjectConstructor: CreateDomainRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Retrieves an existing Domain in the Workspace.
   *
   * @param {string} ref - The reference of the Domain to retrieve
   * @return {Promise<Domain>} - The response object that contains the Domain with full ACL object
   * @example
   * const domains = new SDK.Domains(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * domains
   *   .getDomain(ref)
   *   .then((domain) => {
   *     console.log("Domain:", domain.name);
   *     console.log("ACL:", domain.accessControlList?.name);
   *     console.log("Allowed IPs:", domain.accessControlList?.allow);
   *     console.log("Denied IPs:", domain.accessControlList?.deny);
   *   })
   *   .catch(console.error); // an error occurred
   */
  async getDomain(ref: string): Promise<Domain> {
    const client = this.client.getDomainsClient();
    return await makeRpcRequest<
      GetDomainRequestPB,
      DomainPB,
      BaseApiObject,
      Domain
    >({
      method: client.getDomain.bind(client),
      requestPBObjectConstructor: GetDomainRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  /**
   * Updates an existing Domain in the Workspace.
   *
   * @param {UpdateDomainRequest} request - The request object that contains the necessary information to update an existing Domain
   * @param {string} request.ref - The reference of the Domain to update
   * @param {string} request.name - The name of the Domain
   * @param {string} request.domainUri - The URI of the Domain
   * @param {string} request.accessControlListRef - The reference to the Access Control List (ACL) to associate with the Domain
   * @param {EgressPolicy[]} request.egressPolicies - The egress policy of the Domain
   * @param {string} request.egressPolicies[].rule - A regular expression that defines which calls to send to the PSTN
   * @param {string} request.egressPolicies[].numberRef - The Number that will be used to send the call to the PSTN
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Domain
   * @example
   * const domains = new SDK.Domains(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   accessControlListRef: "00000000-0000-0000-0000-000000000001",
   *   egressPolicies: [
   *     {
   *       rule: ".*",
   *       numberRef: "00000000-0000-0000-0000-000000000002"
   *     }
   *   ]
   * };
   *
   * domains
   *   .updateDomain(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async updateDomain(request: UpdateDomainRequest): Promise<BaseApiObject> {
    const client = this.client.getDomainsClient();
    return await makeRpcRequest<
      UpdateDomainRequestPB,
      UpdateDomainResponsePB,
      UpdateDomainRequest,
      BaseApiObject
    >({
      method: client.updateDomain.bind(client),
      requestPBObjectConstructor: UpdateDomainRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  /**
   * Retrieves a list of Domains from a Workspace.
   *
   * @param {ListDomainsRequest} request - The request object that contains the necessary information to retrieve a list of Domains
   * @param {number} request.pageSize - The number of Domains to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Domains
   * @return {Promise<ListDomainsResponse>} - The response object that contains the list of Domains
   * @example
   * const domains = new SDK.Domains(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * domains
   *   .listDomains(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async listDomains(request: ListDomainsRequest): Promise<ListDomainsResponse> {
    const client = this.client.getDomainsClient();
    return await makeRpcRequest<
      ListDomainsRequestPB,
      ListDomainsResponsePB,
      ListDomainsRequest,
      ListDomainsResponse
    >({
      method: client.listDomains.bind(client),
      requestPBObjectConstructor: ListDomainsRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", DomainPB]]
    });
  }

  /**
   * Deletes an existing Domain from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Domain to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Domain
   * @example
   * const domains = new SDK.Domains(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * domains
   *   .deleteDomain(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async deleteDomain(ref: string): Promise<BaseApiObject> {
    const applicationsClient = this.client.getDomainsClient();
    return await makeRpcRequest<
      DeleteDomainRequestPB,
      DeleteDomainResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: applicationsClient.deleteDomain.bind(applicationsClient),
      requestPBObjectConstructor: DeleteDomainRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Domains };
