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
  BaseApiObject,
  INumberExtended,
  ListNumbersRequest,
  NumbersApi
} from "@fonoster/types";
import { deleteResource } from "../resources/deleteResource";
import { getResource } from "../resources/getResource";
import { listResources } from "../resources/listResources";

const RESOURCE = "Number";

function getNumber(numbers: NumbersApi) {
  return getResource<INumberExtended, BaseApiObject, NumbersApi>(
    numbers,
    RESOURCE
  );
}

function listNumbers(numbers: NumbersApi) {
  return listResources<INumberExtended, ListNumbersRequest, NumbersApi>(
    numbers,
    RESOURCE
  );
}

function deleteNumber(numbers: NumbersApi) {
  return deleteResource<INumberExtended, BaseApiObject, NumbersApi>(
    numbers,
    RESOURCE
  );
}

export { getNumber, listNumbers, deleteNumber };
