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
  AclExtended,
  AclsApi,
  BaseApiObject,
  ListAclsRequest
} from "@fonoster/types";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";

const RESOURCE = "Acl";

function getAcl(acls: AclsApi) {
  return getResource<AclExtended, BaseApiObject, AclsApi>(acls, RESOURCE);
}

function listAcls(acls: AclsApi) {
  return listResources<AclExtended, ListAclsRequest, AclsApi>(acls, RESOURCE);
}

function deleteAcl(acls: AclsApi) {
  return deleteResource<AclExtended, BaseApiObject, AclsApi>(acls, RESOURCE);
}

export { deleteAcl, getAcl, listAcls };
