import FuncPB from "./service/protos/funcs_pb";

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
enum View {
  BASIC = 0,
  STANDARD = 1,
  FULL = 2
}

export interface DeployFuncRequest {
  name: string;
  path: string;
  schedule?: string;
  limits?: {
    memory: undefined | string;
    cpu: undefined | string;
  };
  requests?: {
    memory: undefined | string;
    cpu: undefined | string;
  };
}

export interface GetFuncRequest {
  name: string;
}

export interface GetFuncRequest {
  name: string;
}

export interface GetFuncResponse {
  name: string;
  image: string;
  invocationCount: number;
  replicas: number;
  availableReplicas: number;
  schedule: string;
}

export interface DeleteFuncRequest {
  name: string;
}

export interface DeleteFuncResponse {
  name: string;
}

export interface Func {
  name: string;
  image: string;
  invocationCount: number;
  replicas: number;
  availableReplicas: number;
}

export interface ListFuncsRequest {
  pageSize: number;
  pageToken: string;
  view: View;
}

export interface ListFuncsResponse {
  nextPageToken: string;
  funcs: Func[];
}

export interface FuncParameters {
  request: FuncPB.DeployFuncRequest;
  accessKeyId: string;
}

export interface GetFuncLogsRequest {
  name: string;
  since?: string;
  tail?: number;
  follow?: boolean;
}
