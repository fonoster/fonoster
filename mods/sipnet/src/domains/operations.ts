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
import { DomainsApi } from "./client";
import {
  CreateDomainRequest,
  DeleteDomainRequest,
  Domain,
  GetDomainRequest,
  ListDomainsRequest,
  UpdateDomainRequest
} from "./types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Domain";

function createDomain(domains: DomainsApi) {
  return createResource<Domain, CreateDomainRequest, DomainsApi>(
    domains,
    RESOURCE
  );
}

function updateDomain(domains: DomainsApi) {
  return updateResource<Domain, UpdateDomainRequest, DomainsApi>(
    domains,
    RESOURCE
  );
}

function getDomain(domains: DomainsApi) {
  return getResource<Domain, GetDomainRequest, DomainsApi>(domains, RESOURCE);
}

function listDomains(domains: DomainsApi) {
  return listResources<Domain, ListDomainsRequest, DomainsApi>(
    domains,
    RESOURCE
  );
}

function deleteDomain(domains: DomainsApi) {
  return deleteResource<Domain, DeleteDomainRequest, DomainsApi>(
    domains,
    RESOURCE
  );
}

export { createDomain, updateDomain, getDomain, listDomains, deleteDomain };
