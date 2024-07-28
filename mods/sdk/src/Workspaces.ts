/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import {
  BaseApiObject,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  Workspace
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateWorkspaceRequest as CreateWorkspaceRequestPB,
  CreateWorkspaceResponse as CreateWorkspaceResponsePB,
  DeleteWorkspaceRequest as DeleteWorkspaceRequestPB,
  DeleteWorkspaceResponse as DeleteWorkspaceResponsePB,
  GetWorkspaceRequest as GetWorkspaceRequestPB,
  GetWorkspaceResponse as GetWorkspaceResponsePB,
  UpdateWorkspaceRequest as UpdateWorkspaceRequestPB,
  UpdateWorkspaceResponse as UpdateWorkspaceResponsePB
} from "./generated/node/identity_pb";

class Workspaces {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createWorkspace(
    request: CreateWorkspaceRequest
  ): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      CreateWorkspaceRequestPB,
      CreateWorkspaceResponsePB,
      CreateWorkspaceRequest,
      BaseApiObject
    >({
      method: client.createWorkspace.bind(client),
      requestPBObjectConstructor: CreateWorkspaceRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async getWorkspace(ref: string): Promise<Workspace> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      GetWorkspaceRequestPB,
      GetWorkspaceResponsePB,
      { ref: string },
      Workspace
    >({
      method: client.getWorkspace.bind(client),
      requestPBObjectConstructor: GetWorkspaceRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }

  async updateWorkspace(
    request: UpdateWorkspaceRequest
  ): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      UpdateWorkspaceRequestPB,
      UpdateWorkspaceResponsePB,
      UpdateWorkspaceRequest,
      BaseApiObject
    >({
      method: client.updateWorkspace.bind(client),
      requestPBObjectConstructor: UpdateWorkspaceRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async deleteWorkspace(ref: string): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      DeleteWorkspaceRequestPB,
      DeleteWorkspaceResponsePB,
      BaseApiObject,
      BaseApiObject
    >({
      method: client.deleteWorkspace.bind(client),
      requestPBObjectConstructor: DeleteWorkspaceRequestPB,
      metadata: this.client.getMetadata(),
      request: { ref }
    });
  }
}

export { Workspaces };
