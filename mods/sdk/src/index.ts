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
import { CreateDomainRequest } from "./generated/domains_pb";
import { DomainsClient } from "./generated/DomainsServiceClientPb";

class Fonoster {
  private client: DomainsClient;
  token: string;
  accessKeyId: string;

  constructor(config: { baseUrl: string; token: string; accessKeyId: string }) {
    const { baseUrl, token, accessKeyId } = config;

    this.token = token;
    this.accessKeyId = accessKeyId;
    this.client = new DomainsClient(baseUrl);
    this.client = new DomainsClient(baseUrl, null, null);
  }

  async createDomain() {
    const request = new CreateDomainRequest();
    request.setName("test.com");
    request.setDomainUri("sip.local");

    return await this.client.createDomain(request, {
      token: this.token,
      accessKeyId: this.accessKeyId
    });
  }
}

export default Fonoster;
