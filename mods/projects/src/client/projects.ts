/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { APIClient, ClientOptions } from "@fonoster/common";
import { ProjectsClient } from "../service/protos/projects_grpc_pb";
import ProjectsPB from "../service/protos/projects_pb";
import CommonPB from "../service/protos/common_pb";
import { promisifyAll } from "grpc-promise";
import {
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectResponse,
  GetProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  RenewAccessKeySecretRequest,
  RenewAccessKeySecretResponse,
  IProjectsClient,
  ListProjectsRequest,
  ListProjectsResponse
} from "./types";

/**
 * @classdesc Use Fonoster Projects, a capability of Fonoster,
 * to create, update, get and delete Projects. Projects requires of a
 * running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk")
 * const Projects = new Fonoster.Projects()
 *
 * const request = {
 *   name: "project002",
 *   allowExperiments: false
 * }
 *
 * projects.createProject(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Projects extends APIClient implements IProjectsClient {
  /**
   * Constructs a new Projects object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(ProjectsClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Returns a list of Projects
   *
   * @param {ListProjectsRequest} request - Reserved for future filters
   * @return {Promise<ListProjectsResponse>}
   * @example
   *
   * projects.listProjects({})
   * .then(result => {
   *   console.log(result)             // successful response
   * }).catch(e => console.error(e))   // an error occurred
   */
  async listProjects(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request?: ListProjectsRequest
  ): Promise<ListProjectsResponse> {
    const res = new ProjectsPB.ListProjectsRequest();
    const paginatedList = await super
      .getService()
      .listProjects()
      .sendMessage(res);

    return {
      projects: paginatedList.getProjectsList().map((p: ProjectsPB.Project) => {
        return {
          ref: p.getRef(),
          name: p.getName(),
          userRef: p.getUserRef(),
          accessKeyId: p.getAccessKeyId(),
          accessKeySecret: p.getAccessKeySecret(),
          allowExperiments: p.getAllowExperiments(),
          createTime: p.getCreateTime(),
          updateTime: p.getUpdateTime()
        };
      })
    };
  }

  /**
   * Creates a new Project.
   *
   * @param {CreateProjectRequest} request -  Request to create a new Project
   * @param {string} request.name - Project's name
   * @param {string} request.allowExperiments - Enables experimental APIs
   * @return {Promise<CreateProjectResponse>}
   * @example
   *
   * const request = {
   *   name: "project001",
   *   allowExperiments: true
   * }
   *
   * projects.createProject(request)
   * .then(result => {
   *   console.log(result)             // successful response
   * }).catch(e => console.error(e))   // an error occurred
   */
  async createProject(
    request: CreateProjectRequest
  ): Promise<CreateProjectResponse> {
    const project = new ProjectsPB.CreateProjectRequest();
    project.setName(request.name);
    project.setAllowExperiments(request.allowExperiments);

    const res = await super.getService().createProject().sendMessage(project);

    return {
      ref: res.getRef(),
      name: res.getName(),
      userRef: res.getUserRef(),
      accessKeyId: res.getAccessKeyId(),
      accessKeySecret: res.getAccessKeySecret(),
      allowExperiments: res.getAllowExperiments(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Get a Project by reference.
   *
   * @param {string} ref - Reference to Project
   * @return {Promise<GetProjectResponse>} The Project
   * @throws if ref is null or Project does not exist
   * @example
   *
   * const ref = "507f1f77bcf86cd799439011";
   *
   * projects.getProject(ref)
   * .then(result => {
   *   console.log(result)             // returns the Project payload
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getProject(ref: string): Promise<GetProjectResponse> {
    const request = new ProjectsPB.GetProjectRequest();
    request.setRef(ref);
    const res = await super.getService().getProject().sendMessage(request);

    return {
      ref: res.getRef(),
      name: res.getName(),
      userRef: res.getUserRef(),
      accessKeyId: res.getAccessKeyId(),
      accessKeySecret: res.getAccessKeySecret(),
      allowExperiments: res.getAllowExperiments(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Update a Project.
   *
   * @param {UpdateProjectRequest} request - Request update of an Project
   * @param {string} request.ref - Required reference to the Project
   * @param {string} request.name - Value to rename the application to
   * @param {string} request.allowExperiments - Enables experimental APIs
   * @return {Promise<UpdateProjectResponse>}
   * @example
   *
   * const request = {
   *   name: "project001",
   *   ref: "507f1f77bcf86cd799439011"
   * }
   *
   * projects.updateProject(request)
   * .then(result => {
   *   console.log(result)            // returns the UpdateProjectResponse payload
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateProject(
    request: UpdateProjectRequest
  ): Promise<UpdateProjectResponse> {
    const req = new ProjectsPB.UpdateProjectRequest();
    req.setRef(request.ref);

    if (request.name) req.setName(request.name);
    if (request.allowExperiments)
      req.setAllowExperiments(request.allowExperiments);

    const res = await super.getService().updateProject().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * Delete a Project.
   *
   * @param {string} ref - Project's reference
   * @example
   *
   * const ref = "507f1f77bcf86cd799439011"
   *
   * projects.deleteProject(ref)
   * .then(() => {
   *   console.log("done")            // returns a reference of the Project
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteProject(ref: string): Promise<DeleteProjectResponse> {
    const req = new ProjectsPB.DeleteProjectRequest();
    req.setRef(ref);
    await super.getService().deleteProject().sendMessage(req);
    return { ref };
  }

  /**
   * Generate a new accessKeySecret. Be sure to update your applications with the new value.
   *
   * @param {LoginRequest} request - Request update of an Project
   * @param {string} request.ref - Project's reference
   * @example
   *
   * const request = {
   *  ref: "507f1f77bcf86cd799439011"
   * }
   *
   * projects.renewAccessKeySecret(request)
   * .then(result => {
   *   console.log(result)            // returns the new accessKeySecret
   * }).catch(e => console.error(e))  // an error occurred
   */
  async renewAccessKeySecret(
    request: RenewAccessKeySecretRequest
  ): Promise<RenewAccessKeySecretResponse> {
    const req = new ProjectsPB.RenewAccessKeySecretRequest();
    req.setRef(request.ref);

    const res = await super
      .getService()
      .renewAccessKeySecret()
      .sendMessage(req);

    return {
      accessKeySecret: res.getAccessKeySecret()
    };
  }
}

export { ProjectsPB, CommonPB, IProjectsClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Projects;
module.exports.ProjectsPB = ProjectsPB;
module.exports.CommonPB = CommonPB;
