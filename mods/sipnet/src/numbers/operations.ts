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
import { GetNumberRequest, NumberApi } from "./client";
import { createNumber } from "./createNumber";
import {
  DeleteNumberRequest,
  INumber,
  ListNumbersRequest,
  UpdateNumberRequest
} from "./types";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";
import { updateResource } from "../resources/updateResource";

const RESOURCE = "Number";

function updateNumber(numbers: NumberApi) {
  return updateResource<INumber, UpdateNumberRequest, NumberApi>(
    numbers,
    RESOURCE
  );
}

function getNumber(numbers: NumberApi) {
  return getResource<INumber, GetNumberRequest, NumberApi>(numbers, RESOURCE);
}

function listNumbers(numbers: NumberApi) {
  return listResources<INumber, ListNumbersRequest, NumberApi>(
    numbers,
    RESOURCE
  );
}

function deleteNumber(numbers: NumberApi) {
  return deleteResource<INumber, DeleteNumberRequest, NumberApi>(
    numbers,
    RESOURCE
  );
}

export { createNumber, updateNumber, getNumber, listNumbers, deleteNumber };
