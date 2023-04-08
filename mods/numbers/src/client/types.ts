/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
export interface INumbersClient {
  createNumber(request: CreateNumberRequest): Promise<CreateNumberResponse>;
  getNumber(ref: string): Promise<GetNumberResponse>;
  updateNumber(request: UpdateNumberRequest): Promise<UpdateNumberResponse>;
  listNumbers(request: ListNumbersRequest): Promise<ListNumbersResponse>;
  deleteNumber(ref: string): Promise<DeleteNumberResponse>;
  getIngressInfo(
    request: GetIngressInfoRequest
  ): Promise<GetIngressInfoResponse>;
}

enum View {
  BASIC = 0,
  STANDARD = 1,
  FULL = 2
}

export interface Number {
  ref: string;
  providerRef: string;
  e164Number: string;
  ingressInfo: {
    webhook: string;
  };
  aorLink: string;
  createTime: string;
  updateTime: string;
}

export interface ListNumbersResponse {
  nextPageToken: string;
  numbers: number[];
}

export interface CreateNumberRequest {
  ref?: string;
  providerRef: string;
  e164Number: string;
  ingressInfo?: {
    webhook?: string;
    appRef?: string;
  };
  aorLink?: string;
}

export interface UpdateNumberRequest {
  ref: string;
  aorLink?: string;
  ingressInfo?: {
    webhook?: string;
    appRef?: string;
  };
}

export interface UpdateNumberResponse {
  ref: string;
}

export interface ListNumbersRequest {
  pageSize: number;
  pageToken: string;
  view: View;
}

export interface DeleteNumberResponse {
  ref: string;
}

export interface CreateNumberResponse {
  ref: string;
}

export interface GetNumberResponse {
  ref: string;
  providerRef: string;
  e164Number: string;
  ingressInfo: {
    webhook: string;
    appRef?: string;
  };
  aorLink: string;
  createTime: string;
  updateTime: string;
}

export interface GetIngressInfoRequest {
  e164Number: string;
}

export interface GetIngressInfoResponse {
  accessKeyId: string;
  webhook: string;
  appRef?: string;
}
