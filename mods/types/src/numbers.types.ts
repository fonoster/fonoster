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
import { BaseApiObject } from "./common";
import { TrunkExtended } from "./trunks.types";

type INumberExtended = {
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
  extended?: Record<string, unknown>;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateNumberRequestExtended = {
  name: string;
  telUrl: string;
  aorLink: string;
  city: string;
  country: string;
  countryIsoCode: string;
  // FIXME: Fix upstream this should be an optional field
  sessionAffinityHeader: string;
  extraHeaders: { name: string; value: string }[];
  extended?: Record<string, unknown>;
};

type UpdateNumberRequest = {
  ref: string;
} & Omit<
  Partial<CreateNumberRequest>,
  "telUrl" | "city" | "country" | "countryIsoCode" | "extended"
>;

type ListNumbersRequest = {
  pageSize: number;
  pageToken: string;
};

type ListNumbersResponse = {
  items: INumber[];
  nextPageToken: string;
};

type INumber = Omit<INumberExtended, "extended">;

type CreateNumberRequest = Omit<
  CreateNumberRequestExtended,
  "extended" | "sessionAffinityHeader"
>;

type FCreateNumberRequest = {
  name: string;
  telUrl: string;
  city: string;
  country: string;
  countryIsoCode: string;
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
