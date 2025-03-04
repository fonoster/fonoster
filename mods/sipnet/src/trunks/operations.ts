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
  CreateTrunkRequestExtended,
  ListTrunksRequest,
  TrunkApi,
  TrunkExtended,
  UpdateTrunkRequest
} from "@fonoster/types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Trunk";

function createTrunk(trunks: TrunkApi) {
  return createResource<TrunkExtended, CreateTrunkRequestExtended, TrunkApi>(
    trunks,
    RESOURCE,
    V.createTrunkRequestSchema
  );
}

function updateTrunk(trunks: TrunkApi) {
  return updateResource<TrunkExtended, UpdateTrunkRequest, TrunkApi>(
    trunks,
    RESOURCE,
    V.updateTrunkRequestSchema
  );
}

function getTrunk(trunks: TrunkApi) {
  return getResource<TrunkExtended, BaseApiObject, TrunkApi>(trunks, RESOURCE);
}

function listTrunks(trunks: TrunkApi) {
  return listResources<TrunkExtended, ListTrunksRequest, TrunkApi>(
    trunks,
    RESOURCE
  );
}

function deleteTrunk(trunks: TrunkApi) {
  return deleteResource<TrunkExtended, BaseApiObject, TrunkApi>(
    trunks,
    RESOURCE
  );
}

export { createTrunk, deleteTrunk, getTrunk, listTrunks, updateTrunk };
