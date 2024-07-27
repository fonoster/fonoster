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

class Domains {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

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

  async getDomain(ref: string) {
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
