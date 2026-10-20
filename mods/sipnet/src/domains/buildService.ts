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
import { withSipNameCheck } from "../resources/sipNames";
import { ClientOptions } from "../types";
import {
  createDomain,
  deleteDomain,
  getDomain,
  listDomains,
  updateDomain
} from "./operations";

/**
 * `namesRoot` (e.g. `sip.example.com`) makes every domain one label under it;
 * leave it out to accept any domain.
 */
function buildService(
  clientOptions: ClientOptions,
  options: { namesRoot?: string } = {}
) {
  const client = new SDK.Domains(clientOptions);
  const checkRefs = createCheckRefs(createRefLookups(clientOptions));

  return {
    definition: {
      serviceName: "Domains",
      pckg: "domains",
      version: "v1beta2",
      proto: "domains.proto"
    },
    handlers: {
      createDomain: withSipNameCheck(
        createDomain(client, checkRefs),
        "domainUri",
        "domain",
        options.namesRoot
      ),
      updateDomain: withSipNameCheck(
        updateDomain(client, checkRefs),
        "domainUri",
        "domain",
        options.namesRoot
      ),
      getDomain: getDomain(client),
      listDomains: listDomains(client),
      deleteDomain: deleteDomain(client)
    }
  };
}

export { buildService };
