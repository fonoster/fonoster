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
import { ACLsAPI, GetACLRequest } from "./client";
import {
  ACL,
  CreateACLRequest,
  DeleteACLRequest,
  ListACLsRequest,
  UpdateACLRequest
} from "./types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "ACL";

function createACL(acls: ACLsAPI) {
  return createResource<ACL, CreateACLRequest, ACLsAPI>(acls, RESOURCE);
}

function updateACL(acls: ACLsAPI) {
  return updateResource<ACL, UpdateACLRequest, ACLsAPI>(acls, RESOURCE);
}

function getACL(acls: ACLsAPI) {
  return getResource<ACL, GetACLRequest, ACLsAPI>(acls, RESOURCE);
}

function listACLs(acls: ACLsAPI) {
  return listResources<ACL, ListACLsRequest, ACLsAPI>(acls, RESOURCE);
}

function deleteACL(acls: ACLsAPI) {
  return deleteResource<ACL, DeleteACLRequest, ACLsAPI>(acls, RESOURCE);
}

export { createACL, updateACL, getACL, listACLs, deleteACL };
