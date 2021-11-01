/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
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
import {APIClient, ClientOptions} from "@fonoster/common";
import {ProjectsClient} from "../service/protos/projects_grpc_pb";
import ProjectsPB, {
  ListProjectsRequest,
  ListProjectsResponse
} from "../service/protos/projects_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import {
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectResponse,
  GetProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  RenewAccessKeySecretRequest,
  RenewAccessKeySecretResponse,
  IProjectsClient
} from "./types";

/**
 * @classdesc Use Fonos Projects, a capability of Fonos,
 * to create, update, get and delete Projects. Projects requires of a
 * running Fonos deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonos = require("@fonoster/sdk")
 * const Projects = new Fonos.Projects()
 *
 * const request = {
 *   name: "project002",
 *   allowExperiments: false
 * }
 *
 * Projects.createProject(request)
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
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  listProjects(request: ListProjectsRequest): Promise<ListProjectsResponse> {
    throw new Error("Method not implemented.");
  }

  /**
   * Creates a new Project on Fonos.
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
   * Projects.createProject(request)
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
   * Retrives an Project by reference.
   *
   * @param {string} ref - Reference to Project
   * @return {Promise<GetProjectResponse>} The Project
   * @throws if ref is null or Project does not exist
   * @example
   *
   * const ref = "507f1f77bcf86cd799439011";
   *
   * Projects.getProject(ref)
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
   * Updates an Project.
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
   * Projects.updateProject(request)
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
    if (request.allowExperiments) req.setName(request.name);

    const res = await super.getService().updateProject().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * Deletes a Project.
   *
   * @param {string} ref - Project's reference
   * @example
   *
   * const ref = "507f1f77bcf86cd799439011"
   *
   * Projects.deleteProject(ref)
   * .then(() => {
   *   console.log("done")            // returns a reference of the Project
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteProject(ref: string): Promise<DeleteProjectResponse> {
    const req = new ProjectsPB.DeleteProjectRequest();
    req.setRef(ref);
    await super.getService().deleteProject().sendMessage(req);
    return {ref};
  }

  /**
   * Generates a new accessKeySecret. Be sure to update your applications with the new value.
   *
   * @param {LoginRequest} request - Request update of an Project
   * @param {string} request.email - Login projectname
   * @param {string} request.secret - Login password
   * @example
   *
   * const request = {
   *  ref: "507f1f77bcf86cd799439011"
   * }
   *
   * Projects.loginProject(request)
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

export {ProjectsPB, CommonPB, IProjectsClient};

// WARNING: Workaround for support to commonjs clients
module.exports = Projects;
module.exports.ProjectsPB = ProjectsPB;
module.exports.CommonPB = CommonPB;
