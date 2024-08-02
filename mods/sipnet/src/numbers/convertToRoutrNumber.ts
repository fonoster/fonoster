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
import { CreateNumberRequest } from "@fonoster/types";
import { APP_REF_HEADER, ROUTR_DEFAULT_PEER_AOR } from "../constants";

function convertToRoutrNumber(
  number: CreateNumberRequest,
  accessKeyId: string
) {
  return {
    name: number.name,
    telUrl: number.telUrl,
    aorLink: number.agentAor || ROUTR_DEFAULT_PEER_AOR,
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
    extended: { accessKeyId } as Record<string, unknown>
  };
}

export { convertToRoutrNumber };
