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
export interface AppManagers {
    ref?: string,
    name: string,
    description: string,
    createTime: string,
    updateTime: string,
    status: string,
    accessKeyId: string,
    labels: string
    }
    
    export interface CreateAppManagerRequest {
      ref?: string,
      name: string,
      description: string,
      createTime: string,
      updateTime: string,
      status: string,
      accessKeyId: string,
      labels: string
    }
    
    export interface CreateAppManagerResponse {
      ref?: string,
      name: string,
      description: string,
      createTime: string,
      updateTime: string,
      status: string,
      accessKeyId: string,
      labels: string
    }
    
    export interface GetAppManagerResponse {
      ref?: string,
      name: string,
      description: string,
      createTime?: string;
      updateTime?: string;
      status: string,
      accessKeyId: string,
      labels: string
    }
    
    export interface UpdateAppManagerRequest {
      ref?: string,
      name: string,
      description: string,
      createTime?: string;
      updateTime?: string;
      status: string,
      accessKeyId: string,
      labels: string
    }
    
    export interface UpdateAppManagerResponse {
      ref: string;
    }
    
    export interface ListAppManagerRequest {
      pageSize?: number;
      pageToken?: string;
      view?: number;
    }
    
    export interface ListAppManagerResponse {
      nextPageToken: string;
      apps: AppManagers[];
    }
    
    export interface DeleteAppManagerResponse {
      ref: string;
    }
    