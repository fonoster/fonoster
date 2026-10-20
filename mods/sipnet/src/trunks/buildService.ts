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
import SDK from "@routr/sdk";
import { createCheckRefs, createRefLookups } from "../resources/checkRefs";
import { ClientOptions } from "../types";
import {
  createTrunk,
  deleteTrunk,
  getTrunk,
  listTrunks,
  updateTrunk
} from "./operations";
import { withInboundUriCheck } from "./inboundUri";

/**
 * `inboundUriRoot` (e.g. `sip.acme.com`) makes every inbound URI one label under
 * it; leave it out to accept any host or IP.
 */
function buildService(
  clientOptions: ClientOptions,
  options: { inboundUriRoot?: string } = {}
) {
  const client = new SDK.Trunks(clientOptions);
  const checkRefs = createCheckRefs(createRefLookups(clientOptions));

  return {
    definition: {
      serviceName: "Trunks",
      pckg: "trunks",
      version: "v1beta2",
      proto: "trunks.proto"
    },
    handlers: {
      createTrunk: withInboundUriCheck(
        createTrunk(client, checkRefs),
        options.inboundUriRoot
      ),
      updateTrunk: withInboundUriCheck(
        updateTrunk(client, checkRefs),
        options.inboundUriRoot
      ),
      getTrunk: getTrunk(client),
      listTrunks: listTrunks(client),
      deleteTrunk: deleteTrunk(client)
    }
  };
}

export { buildService };
