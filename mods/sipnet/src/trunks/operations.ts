/* eslint-disable @typescript-eslint/ban-types */
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
import { GetTrunkRequest, TrunkAPI } from "./client";
import {
  CreateTrunkRequest,
  DeleteTrunkRequest,
  ListTrunksRequest,
  Trunk,
  UpdateTrunkRequest
} from "./types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Trunk";

function createTrunk(trunks: TrunkAPI) {
  return createResource<Trunk, CreateTrunkRequest, TrunkAPI>(trunks, RESOURCE);
}

function updateTrunk(trunks: TrunkAPI) {
  return updateResource<Trunk, UpdateTrunkRequest, TrunkAPI>(trunks, RESOURCE);
}

function getTrunk(trunks: TrunkAPI) {
  return getResource<Trunk, GetTrunkRequest, TrunkAPI>(trunks, RESOURCE);
}

function listTrunk(trunks: TrunkAPI) {
  return listResources<Trunk, ListTrunksRequest, TrunkAPI>(trunks, RESOURCE);
}

function deleteTrunk(trunks: TrunkAPI) {
  return deleteResource<Trunk, DeleteTrunkRequest, TrunkAPI>(trunks, RESOURCE);
}

export { createTrunk, updateTrunk, getTrunk, listTrunk, deleteTrunk };
