/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
  CreateProviderRequest,
  CreateProviderResponse,
  UpdateProviderRequest,
  UpdateProviderResponse,
  ListProvidersRequest,
  ListProvidersResponse,
  GetProviderResponse,
  DeleteProviderResponse,
  IProvidersClient,
  Provider
} from "./types";
import { APIClient, ClientOptions } from "@fonoster/common";
import { ProvidersClient } from "../service/protos/providers_grpc_pb";
import ProvidersPB from "../service/protos/providers_pb";
import CommonPB from "../service/protos/common_pb";
import { promisifyAll } from "grpc-promise";

/**
 * @classdesc Use Fonoster Providers, a capability of Fonoster SIP Proxy subsystem,
 * to create, update, get and delete providers. Fonoster Providers requires of a
 * running Fonosterdeployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk");
 * const providers = new Fonoster.Providers();
 *
 * const request = {
 *   name: "SIP Provider",
 *   username: "trunk001",
 *   secret: "secretkey",
 *   host: "sip.provider.net"
 * };
 *
 * providers.createProvider(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e));   // an error occurred
 */
export default class Providers extends APIClient implements IProvidersClient {
  /**
   * Constructs a new Providers object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(ProvidersClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Creates a new Provider on the SIP Proxy subsystem.
   *
   * @param {Object} request -  Request for the provision of a new Provider
   * @param {string} request.name - Friendly name to the Provider
   * @param {string} request.username - Username for the trunk. No required for
   * static IP authentication
   * @param {string} request.secret - Password for the trunk. No required for
   * static IP authentication
   * @param {string} request.host - Hostname or IP of the Provider
   * @param {string} request.transport - The transport for the Provider.
   *Fonoster will use TCP if none is provided
   * @param {string} request.expires - Expiration time for the registration.
   *Fonoster will use 600 if non is provided
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *   name: "Provider Name",
   *   username: "trunk001",
   *   secret: "secretkey",
   *   host: "sip.provider.net"
   * };
   *
   * providers.createProvider(request)
   * .then(result => {
   *   console.log(result)            // returns the Provider object
   * }).catch(e => console.error(e));  // an error occurred
   */
  async createProvider(
    request: CreateProviderRequest
  ): Promise<CreateProviderResponse> {
    const req = new ProvidersPB.CreateProviderRequest();
    req.setName(request.name);
    req.setUsername(request.username);
    req.setSecret(request.secret);
    req.setHost(request.host);
    req.setTransport(request.transport || "tcp");
    req.setExpires(request.expires || 600);

    const res = await super.getService().createProvider().sendMessage(req);

    return {
      ref: res.getRef(),
      name: res.getName(),
      username: res.getUsername(),
      secret: res.getSecret(),
      host: res.getHost(),
      transport: res.getTransport(),
      expires: res.getExpires(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Retrives a Provider by its reference.
   *
   * @param {string} ref - Reference to Provider
   * @return {Promise<Object>} The provider
   * @throws if ref is null or Provider does not exist
   * @example
   *
   * providers.getProvider(ref)
   * .then(result => {
   *   console.log(result)             // returns the Provider object
   * }).catch(e => console.error(e));   // an error occurred
   */
  async getProvider(ref: string): Promise<GetProviderResponse> {
    const request = new ProvidersPB.GetProviderRequest();
    request.setRef(ref);

    const res = await super.getService().getProvider().sendMessage(request);

    return {
      ref: res.getRef(),
      name: res.getName(),
      username: res.getUsername(),
      secret: res.getSecret(),
      host: res.getHost(),
      transport: res.getTransport(),
      expires: res.getExpires(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Update a Provider at the SIP Proxy subsystem.
   *
   * @param {Object} request - Request to update a Provider
   * @param {string} request.ref - Providers reference
   * @param {string} request.name - Friendly name to the Provider
   * @param {string} request.username - Username for the trunk. No required for
   * static IP authentication
   * @param {string} request.secret - Password for the trunk. No required for
   * static IP authentication
   * @param {string} request.host - Hostname or IP of the Provider
   * @param {string} request.transport - The transport for the Provider.
   *Fonoster will use TCP if none is provided
   * @param {string} request.expires - Expiration time for the registration.
   *Fonoster will use 600 if non is provided
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *   ref: "hYTHYCYv_U",
   *   host: "sip.provider.net"
   * };
   *
   * providers.updateProvider(request)
   * .then(result => {
   *   console.log(result)            // returns the Provider from the DB
   * }).catch(e => console.error(e));  // an error occurred
   */
  async updateProvider(
    request: UpdateProviderRequest
  ): Promise<UpdateProviderResponse> {
    const req = new ProvidersPB.UpdateProviderRequest();
    req.setRef(request.ref);
    if (request.name) req.setName(request.name);
    if (request.username) req.setUsername(request.username);
    if (request.secret) req.setSecret(request.secret);
    if (request.host) req.setHost(request.host);
    if (request.transport) req.setTransport(request.transport);
    if (request.expires) req.setExpires(request.expires);

    const res = await super.getService().updateProvider().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * List the Providers registered in Fonoster SIP Proxy subsystem.
   *
   * @param {Object} request
   * @param {provider} request.pageSize - Provider of element per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListProvidersResponse>} List of Providers
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * };
   *
   * providers.listProviders(request)
   * .then(() => {
   *   console.log(result)            // returns a ListProvidersResponse object
   * }).catch(e => console.error(e));  // an error occurred
   */
  async listProviders(
    request: ListProvidersRequest
  ): Promise<ListProvidersResponse> {
    const r = new ProvidersPB.ListProvidersRequest();
    r.setPageSize(request.pageSize);
    r.setPageToken(request.pageToken);
    r.setView(request.view);

    const paginatedList = await this.getService()
      .listProviders()
      .sendMessage(r);

    return {
      nextPageToken: paginatedList.getNextPageToken(),
      providers: paginatedList
        .getProvidersList()
        .map((provider: ProvidersPB.Provider) => {
          return {
            ref: provider.getRef(),
            name: provider.getName(),
            username: provider.getUsername(),
            secret: provider.getSecret(),
            host: provider.getHost(),
            transport: provider.getTransport(),
            expires: provider.getExpires(),
            createTime: provider.getCreateTime(),
            updateTime: provider.getUpdateTime()
          };
        })
    };
  }

  /**
   * Deletes a Provider from SIP Proxy subsystem. Notice, that in order to delete
   * a Provider, you must first delete all it"s Agents.
   *
   * @param {string} ref - Reference to the Provider
   * @example
   *
   * const ref = "hYTHYCYv_U";
   *
   * providers.deleteProvider(ref)
   * .then(() => {
   *   console.log("done")            // returns an empty object
   * }).catch(e => console.error(e));  // an error occurred
   */
  async deleteProvider(ref: string): Promise<DeleteProviderResponse> {
    const req = new ProvidersPB.DeleteProviderRequest();
    req.setRef(ref);
    await super.getService().deleteProvider().sendMessage(req);
    return { ref };
  }
}

export { Provider, ProvidersPB, CommonPB, IProvidersClient };

// WARNING: Workaround to support commonjs clients
module.exports = Providers;
module.exports.ProvidersPB = ProvidersPB;
module.exports.CommonPB = CommonPB;
