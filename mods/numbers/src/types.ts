  
/* 
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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

export interface Number {
  ref: string;
  name: string;
  domainUri: string;
  egressRule: string;
  egressNumberRef: string;
  accessDeny: string[];
  accessAllow: string[];
  createTime: string;
  updateTime: string;
}

export interface ListNumbersResponse {
  nextPageToken: string;
  numbers: Number[]
}

export interface CreateNumberRequest {
    ref: string;
    providerRef: string;
    e164Number: string;
    ingressApp: string;
    aorLink: string;
  }
  enum View {
    BASIC = 0,
    STANDARD = 1,
    FULL = 2,
  }
  
  export interface UpdateNumberRequest {
    ref: string;
    aorLink?: string;
    ingressApp?: string;
  }

  export interface UpdateNumberResponse {
    ref: string;
  }
  
  export interface ListNumbersRequest {
    pageSize: number;
    pageToken: string;
    view: View
  }

  export interface deleteNumberResponse{
    ref:string
  }
  
  export interface CreateNumberResponse{
    ref: string;
    providerRef: string;
    e164Number: string;
    ingressApp: string;
    aorLink: string; 
  }
  export interface GetNumberResponse{
    ref: string;
    providerRef: string;
    e164Number: string;
    ingressApp: string;
    aorLink: string; 
    createTime: string;
    updateTime: string;
  }
  export interface IngressAppRequest {
    e164Number: string
  }
  
  export interface AsObject {
  }