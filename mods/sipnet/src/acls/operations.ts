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
  AclExtended,
  AclsApi,
  BaseApiObject,
  CreateAclRequest,
  ListAclsRequest,
  UpdateAclRequest
} from "@fonoster/types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "ACL";

function createAcl(acls: AclsApi) {
  return createResource<AclExtended, CreateAclRequest, AclsApi>(acls, RESOURCE);
}

function updateAcl(acls: AclsApi) {
  return updateResource<AclExtended, UpdateAclRequest, AclsApi>(acls, RESOURCE);
}

function getAcl(acls: AclsApi) {
  return getResource<AclExtended, BaseApiObject, AclsApi>(acls, RESOURCE);
}

function listAcls(acls: AclsApi) {
  return listResources<AclExtended, ListAclsRequest, AclsApi>(acls, RESOURCE);
}

function deleteAcl(acls: AclsApi) {
  return deleteResource<AclExtended, BaseApiObject, AclsApi>(acls, RESOURCE);
}

export { createAcl, updateAcl, getAcl, listAcls, deleteAcl };
