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
import { CreateDomainRequest, CreateDomainResponse } from "@fonoster/common";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateDomainRequest as CreateDomainRequestPB,
  CreateDomainResponse as CreateDomainResponsePB
} from "./generated/node/domains_pb";

class Domains {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createDomain(
    request: CreateDomainRequest
  ): Promise<CreateDomainResponse> {
    const domainsClient = this.client.getDomainsClient();
    return await makeRpcRequest<
      CreateDomainRequestPB,
      CreateDomainResponsePB,
      CreateDomainRequest,
      CreateDomainResponse
    >(
      domainsClient.createDomain.bind(domainsClient),
      CreateDomainRequestPB,
      this.client.getMetadata(),
      request
    );
  }
}

export { Domains };
