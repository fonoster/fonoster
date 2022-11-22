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
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import grpc from "@grpc/grpc-js";
import ProjectsPB, {
  ListProjectsRequest,
  ListProjectsResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  GetProjectRequest,
  DeleteProjectRequest,
  RenewAccessKeySecretRequest,
  RenewAccessKeySecretResponse,
  Project
} from "./protos/projects_pb";
import { Empty } from "./protos/common_pb";
import {
  IProjectsService,
  ProjectsService,
  IProjectsServer
} from "./protos/projects_grpc_pb";
import { getRedisConnection, getAccessKeyId } from "@fonoster/core";
import objectid from "bson-objectid";
import encoder from "./encoder";
import { assertNotEmpty } from "./assertions";
import JWT from "@fonoster/auth/dist/utils/jwt";
import { AUTH_ISS, getSalt } from "@fonoster/certs";
import Auth from "@fonoster/auth/dist/utils/auth_utils";
import decoder from "./decoder";
import { ErrorCodes, FonosterError } from "@fonoster/errors";

const authenticator = new Auth(new JWT());
const redis = getRedisConnection();

class ProjectsServer implements IProjectsServer {
  [name: string]: grpc.UntypedHandleCall;
  async createProject(
    call: grpc.ServerUnaryCall<CreateProjectRequest, ProjectsPB.Project>,
    callback: grpc.sendUnaryData<ProjectsPB.Project>
  ): Promise<void> {
    try {
      assertNotEmpty("name", call.request.getName());

      // Prefixing Project's accessKeyID to avoid confusion with user accounts
      const ref = "PJ" + objectid();
      const userRef = getAccessKeyId(call);
      const project = new ProjectsPB.Project();

      const result = await authenticator.createToken(
        ref,
        AUTH_ISS,
        "PROJECT",
        getSalt(),
        "1y"
      );

      project.setRef(ref);
      project.setAccessKeyId(ref);
      project.setUserRef(userRef);
      project.setAccessKeySecret(result.accessToken);
      project.setName(call.request.getName());
      project.setAllowExperiments(call.request.getAllowExperiments());
      project.setUpdateTime(new Date().toISOString());
      project.setCreateTime(new Date().toISOString());

      redis.set(ref, encoder(project));
      redis.sadd("u_" + userRef, ref);
      callback(null, project);
    } catch (e) {
      callback(e, null);
    }
  }

  async updateProject(
    call: grpc.ServerUnaryCall<UpdateProjectRequest, ProjectsPB.Project>,
    callback: grpc.sendUnaryData<ProjectsPB.Project>
  ) {
    try {
      const ref = call.request.getRef();
      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const project = decoder(raw.toString());

      if (getAccessKeyId(call) !== project.getUserRef()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      if (call.request.getName()) project.setName(call.request.getName());

      // TODO: Make this parameter optional.
      project.setAllowExperiments(call.request.getAllowExperiments());
      project.setUpdateTime(new Date().toISOString());
      redis.set(ref, encoder(project));
      callback(null, project);
    } catch (e) {
      callback(e, null);
    }
  }

  async getProject(
    call: grpc.ServerUnaryCall<GetProjectRequest, ProjectsPB.Project>,
    callback: grpc.sendUnaryData<ProjectsPB.Project>
  ) {
    try {
      const ref = call.request.getRef();
      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const project = decoder(raw.toString());

      if (getAccessKeyId(call) !== project.getUserRef()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      callback(null, project);
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteProject(
    call: grpc.ServerUnaryCall<DeleteProjectRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      const ref = call.request.getRef();
      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const project = decoder(raw.toString());

      if (getAccessKeyId(call) !== project.getUserRef()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      redis.del(project.getRef());
      redis.srem("u_" + project.getUserRef(), project.getRef());

      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }

  async listProjects(
    call: grpc.ServerUnaryCall<ListProjectsRequest, ListProjectsResponse>,
    callback: grpc.sendUnaryData<ListProjectsResponse>
  ) {
    try {
      const list = await redis.smembers("u_" + getAccessKeyId(call));
      const projects: Project[] = await Promise.all(
        list.map(async (ref) => {
          const raw = (await redis.get(ref)).toString();
          return decoder(raw);
        })
      );

      const response = new ListProjectsResponse();
      response.setProjectsList(projects);

      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }

  async renewAccessKeySecret(
    call: grpc.ServerUnaryCall<
      RenewAccessKeySecretRequest,
      RenewAccessKeySecretResponse
    >,
    callback: grpc.sendUnaryData<RenewAccessKeySecretResponse>
  ) {
    try {
      const ref = call.request.getRef();
      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const project = decoder(raw.toString());

      if (getAccessKeyId(call) !== project.getUserRef()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      const result = await authenticator.createToken(
        project.getAccessKeyId(),
        AUTH_ISS,
        "PROJECT",
        getSalt(),
        "1y"
      );

      project.setAccessKeySecret(result.accessToken);
      project.setUpdateTime(new Date().toISOString());
      redis.set(project.getRef(), encoder(project));

      const response = new RenewAccessKeySecretResponse();
      response.setAccessKeySecret(result.accessToken);
      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }
}

export { ProjectsServer as default, IProjectsService, ProjectsService };
