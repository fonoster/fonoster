/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
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
import * as c from "./generated/api";
import { IProjectsClient } from "@fonoster/projects";
import {
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectResponse,
  GetProjectResponse,
  ListProjectsRequest,
  ListProjectsResponse,
  UpdateProjectRequest,
  UpdateProjectResponse
} from "../../projects/src/client/types";
import { WebClientOptions } from "./types";
import WebAPIClient from "./web_client";

export default class Projects extends WebAPIClient implements IProjectsClient {
  constructor(options: WebClientOptions) {
    super(c, "ProjectsApi", options);
  }

  async createProject(
    request: CreateProjectRequest
  ): Promise<CreateProjectResponse> {
    return (await super.run("createProject", request)) as any;
  }

  async getProject(ref: string): Promise<GetProjectResponse> {
    return (await super.run("getProject", ref)) as any;
  }

  async updateProject(
    request: UpdateProjectRequest
  ): Promise<UpdateProjectResponse> {
    return (await super.run("updateProject", request)) as any;
  }

  async listProjects(
    request: ListProjectsRequest
  ): Promise<ListProjectsResponse> {
    return (await super.run("listProjects", request)) as any;
  }

  async deleteProject(ref: string): Promise<DeleteProjectResponse> {
    return (await super.run("deleteProject", ref)) as any;
  }
}
