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
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { TrunkExtended } from "./trunks.types";
import { Flatten } from "./utils";

type INumber = {
  ref: string;
  name: string;
  telUrl: string;
  aorLink: string;
  city: string;
  country: string;
  countryIsoCode: string;
  sessionAffinityHeader: string;
  extraHeaders: { name: string; value: string }[];
  trunk?: TrunkExtended;
  createdAt: Date;
  updatedAt: Date;
  extended?: Record<string, unknown>;
};

type INumberExtended = INumber & { extended?: Record<string, unknown> };

type CreateNumberRequest = {
  name: string;
  telUrl: string;
  aorLink: string;
  city: string;
  country: string;
  countryIsoCode: string;
};

type CreateNumberRequestExtended = CreateNumberRequest & {
  sessionAffinityHeader: string;
  trunkRef?: string;
  extended?: Record<string, unknown>;
  extraHeaders?: { name: string; value: string }[];
};

type UpdateNumberRequest = Flatten<
  BaseApiObject &
    Omit<
      Partial<CreateNumberRequest>,
      "telUrl" | "city" | "country" | "countryIsoCode"
    >
>;

type ListNumbersRequest = ListRequest;

type ListNumbersResponse = ListResponse<INumber>;

type FCreateNumberRequest = {
  name: string;
  telUrl: string;
  city: string;
  country: string;
  countryIsoCode: string;
  trunkRef?: string;
  appRef?: string;
  agentAor?: string;
};

type FUpdateNumberRequest = {
  ref: string;
  name?: string;
  appRef?: string;
  agentAor?: string;
};

type NumbersApi = {
  createNumber(request: CreateNumberRequestExtended): Promise<BaseApiObject>;
  updateNumber(request: UpdateNumberRequest): Promise<BaseApiObject>;
  getNumber(ref: string): Promise<INumberExtended>;
  deleteNumber(ref: string): Promise<void>;
  listNumbers(request: ListNumbersRequest): Promise<ListNumbersResponse>;
};

export {
  INumber,
  INumberExtended,
  NumbersApi,
  CreateNumberRequest,
  CreateNumberRequestExtended,
  UpdateNumberRequest,
  ListNumbersRequest,
  ListNumbersResponse,
  FCreateNumberRequest,
  FUpdateNumberRequest
};
