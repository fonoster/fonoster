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
import { APP_REF_HEADER } from "@fonoster/common";
import { INumber, INumberExtended } from "@fonoster/types";

function convertToFonosterNumber(number: INumberExtended): INumber {
  const appRef = number.extraHeaders?.find(
    (header) => header.name === APP_REF_HEADER
  )?.value;

  return {
    ref: number.ref,
    name: number.name,
    telUrl: number.telUrl,
    appRef,
    agentAor: appRef ? undefined : number.aorLink,
    city: number.city,
    country: number.country,
    countryIsoCode: number.countryIsoCode,
    trunk: number.trunk,
    createdAt: new Date(number.createdAt * 1000),
    updatedAt: new Date(number.updatedAt * 1000)
  };
}

export { convertToFonosterNumber };
