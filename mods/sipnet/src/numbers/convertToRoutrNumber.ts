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

function convertToRoutrNumber(
  number: CreateNumberRequest,
  accessKeyId: string
) {
  const aorLink = number.appRef ? ROUTR_DEFAULT_PEER_AOR : number.agentAor;

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
    extended: { accessKeyId } as Record<string, unknown>
  };
}

function convertToRoutrNumberUpdate(number: UpdateNumberRequest) {
  let aorLink: string | undefined;
  let extraHeaders: { name: string; value: string }[] = [];

  if (number.appRef) {
    aorLink = ROUTR_DEFAULT_PEER_AOR;
    extraHeaders.push({
      name: APP_REF_HEADER,
      value: number.appRef
    });
  } else if (number.agentAor) {
    extraHeaders = null;
    aorLink = number.agentAor;
  }

  return {
    ref: number.ref,
    name: number.name,
    aorLink,
    extraHeaders,
    trunkRef: number.trunkRef
  };
}

export { convertToRoutrNumber, convertToRoutrNumberUpdate };
