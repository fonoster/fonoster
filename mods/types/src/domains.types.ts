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
import { BaseApiObject } from "./common";

type DomainExtended = {
  ref: string;
  name: string;
  domainUri: string;
  accessControlListRef?: string;
  egressPolicies?: { rule: string; numberRef: string }[];
  extended?: Record<string, unknown>;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateDomainRequestExtended = {
  name: string;
  domainUri: string;
  accessControlListRef?: string;
  egressPolicies?: { rule: string; numberRef: string }[];
  extended: {
    accessKeyId: string;
  };
};

type UpdateDomainRequest = BaseApiObject &
  Omit<Partial<CreateDomainRequest>, "domainUri" | "extended">;

type ListDomainsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListDomainsResponse = {
  items: Domain[];
  nextPageToken: string;
};

type DomainsApi = {
  createDomain: (request: CreateDomainRequest) => Promise<BaseApiObject>;
  updateDomain: (request: UpdateDomainRequest) => Promise<BaseApiObject>;
  getDomain: (ref: string) => Promise<Domain>;
  listDomains: (request: ListDomainsRequest) => Promise<ListDomainsResponse>;
  deleteDomain: (ref: string) => Promise<void>;
};

type Domain = Omit<DomainExtended, "extended">;

type CreateDomainRequest = Omit<CreateDomainRequestExtended, "extended">;

export {
  Domain,
  DomainExtended,
  DomainsApi,
  CreateDomainRequestExtended,
  CreateDomainRequest,
  UpdateDomainRequest,
  ListDomainsRequest,
  ListDomainsResponse
};
