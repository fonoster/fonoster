/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import * as c from "./generated/api";
import { IDomainsClient } from "@fonoster/domains";
import {
  CreateDomainRequest,
  CreateDomainResponse,
  DeleteDomainResponse,
  GetDomainResponse,
  ListDomainsRequest,
  ListDomainsResponse,
  UpdateDomainRequest,
  UpdateDomainResponse
} from "../../domains/src/client/types";
import { WebClientOptions } from "./types";
import WebAPIClient from "./web_client";

export default class Domains extends WebAPIClient implements IDomainsClient {
  constructor(options: WebClientOptions) {
    super(c, "DomainsApi", options);
  }

  async createDomain(
    request: CreateDomainRequest
  ): Promise<CreateDomainResponse> {
    return (await super.run("createDomain", request)) as any;
  }

  async getDomain(ref: string): Promise<GetDomainResponse> {
    return (await super.run("getDomain", ref)) as any;
  }

  async updateDomain(
    request: UpdateDomainRequest
  ): Promise<UpdateDomainResponse> {
    return (await super.run("updateDomain", request)) as any;
  }

  async listDomains(request: ListDomainsRequest): Promise<ListDomainsResponse> {
    return (await super.run("listDomains", request)) as any;
  }

  async deleteDomain(ref: string): Promise<DeleteDomainResponse> {
    return (await super.run("deleteDomain", ref)) as any;
  }
}
