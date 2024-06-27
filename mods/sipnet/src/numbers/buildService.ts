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
import { NumberPreconditionsCheck } from "@fonoster/common";
import SDK from "@routr/sdk";
import {
  createNumber,
  deleteNumber,
  getNumber,
  listNumbers,
  updateNumber
} from "./operations";
import { ClientOptions } from "../types";

function buildService(
  clientOptions: ClientOptions,
  checkNumberPreconditions: NumberPreconditionsCheck
) {
  const client = new SDK.Numbers(clientOptions);

  return {
    definition: {
      serviceName: "Numbers",
      pckg: "numbers",
      version: "v1beta2",
      proto: "numbers.proto"
    },
    handlers: {
      createNumber: createNumber(client, checkNumberPreconditions),
      updateNumber: updateNumber(client),
      getNumber: getNumber(client),
      listNumbers: listNumbers(client),
      deleteNumber: deleteNumber(client)
    }
  };
}

export { buildService };
