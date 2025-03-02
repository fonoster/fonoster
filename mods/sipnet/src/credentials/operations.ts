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
  CreateCredentialsRequestExtended,
  CredentialsApi,
  CredentialsExtended,
  ListCredentialsRequest,
  UpdateCredentialsRequest
} from "@fonoster/types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Credentials";

function createCredentials(credentials: CredentialsApi) {
  return createResource<
    CredentialsExtended,
    CreateCredentialsRequestExtended,
    CredentialsApi
  >(credentials, RESOURCE, V.createCredentialsRequestSchema);
}

function updateCredentials(credentials: CredentialsApi) {
  return updateResource<
    CredentialsExtended,
    UpdateCredentialsRequest,
    CredentialsApi
  >(credentials, RESOURCE, V.updateCredentialsRequestSchema);
}

function getCredentials(credentials: CredentialsApi) {
  return getResource<CredentialsExtended, BaseApiObject, CredentialsApi>(
    credentials,
    RESOURCE
  );
}

function listCredentials(credentials: CredentialsApi) {
  return listResources<
    CredentialsExtended,
    ListCredentialsRequest,
    CredentialsApi
  >(credentials, RESOURCE);
}

function deleteCredentials(credentials: CredentialsApi) {
  return deleteResource<CredentialsExtended, BaseApiObject, CredentialsApi>(
    credentials,
    RESOURCE
  );
}

export {
  createCredentials,
  deleteCredentials,
  getCredentials,
  listCredentials,
  updateCredentials
};
