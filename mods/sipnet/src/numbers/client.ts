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
import { JsonObject } from "@prisma/client/runtime/library";
import { Trunk } from "../trunks/client";

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
  trunk?: Trunk;
  extended?: JsonObject;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateNumberRequest = {
  name: string;
  telUrl: string;
  aorLink: string;
  city: string;
  country: string;
  countryIsoCode: string;
  // FIXME: Fix upstream this should be an optional field
  sessionAffinityHeader: string;
  extraHeaders: { name: string; value: string }[];
  extended: {
    accessKeyId: string;
  };
};

type UpdateNumberRequest = {
  ref: string;
} & Omit<
  Partial<CreateNumberRequest>,
  "telUrl" | "city" | "country" | "countryIsoCode" | "extended"
>;

type CreateNumberResponse = {
  ref: string;
};

type UpdateNumberResponse = {
  ref: string;
};

type GetNumberRequest = {
  ref: string;
};

type DeleteNumberRequest = {
  ref: string;
};

type ListNumbersRequest = {
  pageSize: number;
  pageToken: string;
};

type ListNumbersResponse = {
  items: INumber[];
  nextPageToken: string;
};

type NumberApi = {
  createNumber(request: CreateNumberRequest): Promise<CreateNumberResponse>;
  updateNumber(request: UpdateNumberRequest): Promise<UpdateNumberResponse>;
  getNumber(ref: string): Promise<INumber>;
  deleteNumber(ref: string): Promise<void>;
  listNumbers(request: ListNumbersRequest): Promise<ListNumbersResponse>;
};

export {
  INumber,
  NumberApi,
  CreateNumberRequest,
  UpdateNumberRequest,
  CreateNumberResponse,
  UpdateNumberResponse,
  GetNumberRequest,
  DeleteNumberRequest,
  ListNumbersRequest,
  ListNumbersResponse
};
