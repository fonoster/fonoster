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
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { TrunkExtended } from "./trunks.types";
import { Flatten, RenameAndConvertToTimestamp } from "./utils";

type INumber = {
  ref: string;
  name: string;
  telUrl: string;
  appRef?: string;
  agentAor?: string;
  city: string;
  country: string;
  countryIsoCode: string;
  trunk?: {
    ref: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

type CreateNumberRequest = {
  name: string;
  telUrl: string;
  city: string;
  country: string;
  countryIsoCode: string;
  trunkRef?: string;
  appRef?: string;
  agentAor?: string;
};

type UpdateNumberRequest = Flatten<
  BaseApiObject &
    Omit<
      Partial<CreateNumberRequest>,
      "telUrl" | "city" | "country" | "countryIsoCode"
    >
>;

type INumberExtended = RenameAndConvertToTimestamp<
  Omit<INumber, "appRef" | "agentAor" | "trunk">
> & {
  aorLink?: string;
  trunk?: TrunkExtended;
  extended?: Record<string, unknown>;
  extraHeaders?: { name: string; value: string }[];
};

type CreateNumberRequestExtended = CreateNumberRequest & {
  trunkRef?: string;
  extended?: Record<string, unknown>;
  extraHeaders?: { name: string; value: string }[];
};

type ListNumbersRequest = ListRequest;

type ListNumbersResponse = ListResponse<INumber>;

type ListNumbersResponseExtended = ListResponse<INumberExtended>;

type NumbersApi = {
  createNumber(request: CreateNumberRequestExtended): Promise<BaseApiObject>;
  updateNumber(request: UpdateNumberRequest): Promise<BaseApiObject>;
  getNumber(ref: string): Promise<INumberExtended>;
  deleteNumber(ref: string): Promise<void>;
  listNumbers(
    request: ListNumbersRequest
  ): Promise<ListNumbersResponseExtended>;
};

export {
  CreateNumberRequest,
  CreateNumberRequestExtended,
  INumber,
  INumberExtended,
  ListNumbersRequest,
  ListNumbersResponse,
  NumbersApi,
  UpdateNumberRequest
};
