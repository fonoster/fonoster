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
import { GetNumberRequest, NumberAPI } from "./client";
import {
  CreateNumberRequest,
  DeleteNumberRequest,
  INumber,
  ListNumbersRequest,
  UpdateNumberRequest
} from "./types";
import { createResource } from "../resources/createResource";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Number";

function createNumber(numbers: NumberAPI) {
  return createResource<INumber, CreateNumberRequest, NumberAPI>(
    numbers,
    RESOURCE
  );
}

function updateNumber(numbers: NumberAPI) {
  return updateResource<INumber, UpdateNumberRequest, NumberAPI>(
    numbers,
    RESOURCE
  );
}

function getNumber(numbers: NumberAPI) {
  return getResource<INumber, GetNumberRequest, NumberAPI>(numbers, RESOURCE);
}

function listNumbers(numbers: NumberAPI) {
  return listResources<INumber, ListNumbersRequest, NumberAPI>(
    numbers,
    RESOURCE
  );
}

function deleteNumber(numbers: NumberAPI) {
  return deleteResource<INumber, DeleteNumberRequest, NumberAPI>(
    numbers,
    RESOURCE
  );
}

export { createNumber, updateNumber, getNumber, listNumbers, deleteNumber };
