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
import { CredentialsAPI, GetCredentialsRequest } from "./client";
import {
  CreateCredentialsRequest,
  Credentials,
  DeleteCredentialsRequest,
  ListCredentialsRequest,
  UpdateCredentialsRequest
} from "./types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Credentials";

function createCredentials(credentials: CredentialsAPI) {
  return createResource<Credentials, CreateCredentialsRequest, CredentialsAPI>(
    credentials,
    RESOURCE
  );
}

function updateCredentials(credentials: CredentialsAPI) {
  return updateResource<Credentials, UpdateCredentialsRequest, CredentialsAPI>(
    credentials,
    RESOURCE
  );
}

function getCredentials(credentials: CredentialsAPI) {
  return getResource<Credentials, GetCredentialsRequest, CredentialsAPI>(
    credentials,
    RESOURCE
  );
}

function listCredentials(credentials: CredentialsAPI) {
  return listResources<Credentials, ListCredentialsRequest, CredentialsAPI>(
    credentials,
    RESOURCE
  );
}

function deleteCredentials(credentials: CredentialsAPI) {
  return deleteResource<Credentials, DeleteCredentialsRequest, CredentialsAPI>(
    credentials,
    RESOURCE
  );
}

export {
  createCredentials,
  updateCredentials,
  getCredentials,
  listCredentials,
  deleteCredentials
};
