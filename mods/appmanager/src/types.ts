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
export interface App {
  ref: string;
  name: string;
  description?: string;
  createTime: string;
  updateTime: string;
  status: string;
}

export interface DeployAppRequest {
  path: string;
  ref?: string;
}

export interface CreateAppResponse {
  ref: string;
  name: string;
  description?: string;
  createTime: string;
  updateTime: string;
}

export interface GetAppResponse {
  ref: string;
  name: string;
  description?: string;
  createTime: string;
  updateTime: string;
  status: string;
}

export interface UpdateAppRequest {
  ref: string;
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateAppResponse {
  ref: string;
}

export interface ListAppRequest {
  pageSize?: number;
  pageToken?: string;
  view?: number;
}

export interface ListAppResponse {
  nextPageToken: string;
  apps: App[];
}

export interface DeleteAppResponse {
  ref: string;
}

export interface AppRequest {
  dirPath: string;
  app: {
    name: string;
    description?: string;
  };
}
