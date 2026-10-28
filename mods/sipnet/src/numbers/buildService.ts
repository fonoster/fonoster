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
import { createCheckRefs, createRefLookups } from "../resources/checkRefs";
import { ClientOptions } from "../types";
import { createNumber } from "./createNumber";
import { NumberRouting } from "./engineRouting";
import { getNumber } from "./getNumber";
import { linkTwilioNumber } from "./linkTwilioNumber";
import { listNumbers } from "./listNumbers";
import { deleteNumber } from "./operations";
import { updateNumber } from "./updateNumber";

/**
 * `routing` picks the peer app-linked numbers point at (default: the roomr peer). `twilioLink`
 * is the install's PSTN root and public signaling addresses, for LinkTwilioNumber.
 */
function buildService(
  clientOptions: ClientOptions,
  checkNumberPreconditions: NumberPreconditionsCheck,
  routing?: NumberRouting,
  twilioLink: { pstnRoot: string; signalingAddresses: string[] } = {
    pstnRoot: "",
    signalingAddresses: []
  }
) {
  const client = new SDK.Numbers(clientOptions);
  const checkRefs = createCheckRefs(createRefLookups(clientOptions));

  return {
    definition: {
      serviceName: "Numbers",
      pckg: "numbers",
      version: "v1beta2",
      proto: "numbers.proto"
    },
    handlers: {
      createNumber: createNumber(
        client,
        checkNumberPreconditions,
        routing,
        checkRefs
      ),
      updateNumber: updateNumber(
        client,
        checkNumberPreconditions,
        routing,
        checkRefs
      ),
      getNumber: getNumber(client),
      listNumbers: listNumbers(client),
      deleteNumber: deleteNumber(client),
      linkTwilioNumber: linkTwilioNumber({
        numbers: client,
        trunks: new SDK.Trunks(clientOptions),
        credentials: new SDK.Credentials(clientOptions),
        checkNumberPreconditions,
        routing,
        checkRefs,
        ...twilioLink
      })
    }
  };
}

export { buildService };
