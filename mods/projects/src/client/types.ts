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
export interface IProjectsClient {
  createProject(request: CreateProjectRequest): Promise<CreateProjectResponse>;
  getProject(ref: string): Promise<GetProjectResponse>;
  updateProject(request: UpdateProjectRequest): Promise<UpdateProjectResponse>;
  listProjects(request: ListProjectsRequest): Promise<ListProjectsResponse>;
  deleteProject(ref: string): Promise<DeleteProjectResponse>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ListProjectsRequest {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ListProjectsResponse {
  projects: Project[];
}

export interface Project {
  ref: string;
  name: string;
  userRef: string;
  accessKeyId: string;
  accessKeySecret: string;
  allowExperiments: string;
  createTime: string;
  updateTime: string;
}

export interface CreateProjectRequest {
  name: string;
  allowExperiments: boolean;
}

export interface CreateProjectResponse {
  ref: string;
  name: string;
  userRef: string;
  accessKeyId: string;
  accessKeySecret: string;
  allowExperiments: string;
  createTime: string;
  updateTime: string;
}

export interface UpdateProjectRequest {
  ref: string;
  name?: string;
  allowExperiments: boolean;
}

export interface UpdateProjectResponse {
  ref: string;
}

export interface GetProjectRequest {
  ref: string;
}

export interface GetProjectResponse {
  ref: string;
  name: string;
  userRef: string;
  accessKeyId: string;
  accessKeySecret: string;
  allowExperiments: string;
  createTime: string;
  updateTime: string;
}

export interface DeleteProjectRequest {
  ref: string;
}

export interface DeleteProjectResponse {
  ref: string;
}

export interface RenewAccessKeySecretRequest {
  ref: string;
}

export interface RenewAccessKeySecretResponse {
  accessKeySecret: string;
}
