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
import { APP_REF_HEADER, ROUTR_DEFAULT_PEER_AOR } from "@fonoster/common";
import { CreateNumberRequest, UpdateNumberRequest } from "@fonoster/types";

/**
 * `appPeerAor` is the peer an app-linked number routes to: the roomr peer by default (see
 * engineRouting.ts).
 */
function convertToRoutrNumber(
  number: CreateNumberRequest,
  accessKeyId: string,
  appPeerAor: string = ROUTR_DEFAULT_PEER_AOR
) {
  const aorLink = number.appRef ? appPeerAor : number.agentAor;

  return {
    name: number.name,
    telUrl: number.telUrl,
    aorLink,
    city: number.city,
    country: number.country,
    countryIsoCode: number.countryIsoCode,
    extraHeaders: number.appRef
      ? [
          {
            name: APP_REF_HEADER,
            value: number.appRef
          }
        ]
      : [],
    trunkRef: number.trunkRef,
    // Routr keeps the aliases unique per Trunk and answers INVALID_ARGUMENT otherwise
    ...(number.aliases?.length ? { aliases: number.aliases } : {}),
    extended: { accessKeyId } as Record<string, unknown>
  };
}

/**
 * A route ("appRef" or "agentAor") replaces the stored one and its app header; "" in either
 * removes the route. Without either, the route is kept. `trunkRef` "" removes the Trunk and an
 * absent one keeps it.
 */
function convertToRoutrNumberUpdate(
  number: UpdateNumberRequest,
  appPeerAor: string = ROUTR_DEFAULT_PEER_AOR
) {
  const route: {
    aorLink?: string;
    extraHeaders?: { name: string; value: string }[];
    clearExtraHeaders?: boolean;
  } = {};

  if (number.appRef) {
    route.aorLink = appPeerAor;
    route.extraHeaders = [{ name: APP_REF_HEADER, value: number.appRef }];
  } else if (number.agentAor) {
    route.aorLink = number.agentAor;
    route.clearExtraHeaders = true;
  } else if (number.appRef === "" || number.agentAor === "") {
    route.aorLink = "";
    route.clearExtraHeaders = true;
  }

  return {
    ref: number.ref,
    ...(number.name !== undefined ? { name: number.name } : {}),
    ...route,
    ...(number.trunkRef !== undefined ? { trunkRef: number.trunkRef } : {}),
    // A non-empty list replaces the aliases, an empty one keeps them; clearAliases removes them
    ...(number.aliases?.length ? { aliases: number.aliases } : {}),
    ...(number.clearAliases ? { clearAliases: true } : {})
  };
}

export { convertToRoutrNumber, convertToRoutrNumberUpdate };
