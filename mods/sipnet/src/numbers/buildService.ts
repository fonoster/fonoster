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
import { NumberPreconditionsCheck } from "@fonoster/common";
import SDK from "@routr/sdk";
import { ClientOptions } from "../types";
import { createNumber } from "./createNumber";
import { getNumber } from "./getNumber";
import { listNumbers } from "./listNumbers";
import { deleteNumber } from "./operations";
import { updateNumber } from "./updateNumber";

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
      updateNumber: updateNumber(client, checkNumberPreconditions),
      getNumber: getNumber(client),
      listNumbers: listNumbers(client),
      deleteNumber: deleteNumber(client)
    }
  };
}

export { buildService };
