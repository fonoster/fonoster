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
import { Validators as V } from "@fonoster/common";
import {
  BaseApiObject,
  CreateDomainRequestExtended,
  DomainExtended,
  DomainsApi,
  ListDomainsRequest,
  UpdateDomainRequest
} from "@fonoster/types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Domain";

function createDomain(domains: DomainsApi) {
  return createResource<CreateDomainRequestExtended, BaseApiObject, DomainsApi>(
    domains,
    RESOURCE,
    V.createDomainRequestSchema
  );
}

function updateDomain(domains: DomainsApi) {
  return updateResource<UpdateDomainRequest, BaseApiObject, DomainsApi>(
    domains,
    RESOURCE,
    V.updateDomainRequestSchema
  );
}

function getDomain(domains: DomainsApi) {
  return getResource<DomainExtended, BaseApiObject, DomainsApi>(
    domains,
    RESOURCE
  );
}

function listDomains(domains: DomainsApi) {
  return listResources<DomainExtended, ListDomainsRequest, DomainsApi>(
    domains,
    RESOURCE
  );
}

function deleteDomain(domains: DomainsApi) {
  return deleteResource<DomainExtended, BaseApiObject, DomainsApi>(
    domains,
    RESOURCE
  );
}

export { createDomain, deleteDomain, getDomain, listDomains, updateDomain };
