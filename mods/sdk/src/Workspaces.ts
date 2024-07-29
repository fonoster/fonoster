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
  InviteUserToWorkspaceRequest,
  ListWorkspacesResponse,
  RemoveUserFromWorkspaceRequest,
  RemoveUserFromWorkspaceResponse,
  ResendWorkspaceMembershipInvitationRequest,
  ResendWorkspaceMembershipInvitationResponse,
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
  InviteUserToWorkspaceRequest as InviteUserToWorkspaceRequestPB,
  InviteUserToWorkspaceResponse as InviteUserToWorkspaceResponsePB,
  ListWorkspacesRequest as ListWorkspacesRequestPB,
  ListWorkspacesResponse as ListWorkspacesResponsePB,
  RemoveUserFromWorkspaceRequest as RemoveUserFromWorkspaceRequestPB,
  RemoveUserFromWorkspaceResponse as RemoveUserFromWorkspaceResponsePB,
  ResendWorkspaceMembershipInvitationRequest as ResendWorkspaceMembershipInvitationRequestPB,
  ResendWorkspaceMembershipInvitationResponse as ResendWorkspaceMembershipInvitationResponsePB,
  UpdateWorkspaceRequest as UpdateWorkspaceRequestPB,
  UpdateWorkspaceResponse as UpdateWorkspaceResponsePB,
  Workspace as WorkspacePB
} from "./generated/node/identity_pb";

/**
 * @classdesc Fonoster Workspaces, part of the Fonoster Identity subsystem,
 * allows you to create, update, retrieve, and delete Workspaces in the system.
 * Note that an active Fonoster deployment is required.
 *
 * @example
 *
 * const SDK = require("@fonoster/sdk");
 *
 * async function main(request) {
 *  const apiKey = "your-api-key";
 *  const accessKeyId = "00000000-0000-0000-0000-000000000000";
 *
 *  try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.loginWithApiKey(apiKey);
 *
 *     const workspaces = new SDK.Workspaces(client);
 *     const response = await workspaces.createWorkspace(request);
 *
 *     console.log(response); // successful response
 *   } catch (e) {
 *     console.error(e); // an error occurred
 *   }
 * }
 *
 * const request = {
 *   name: "My Workspace"
 * };
 *
 * main(request).catch(console.error);
 */
class Workspaces {
  private client: FonosterClient;
  /**
   * Constructs a new Workspaces object.
   *
   * @param {FonosterClient} client - Client object with underlying implementations to make requests to Fonoster's API
   * @see AbstractClient
   * @see FonosterClient
   */
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

  /**
   * Retrieves an existing Workspace in the system.
   *
   * @param {string} ref - The reference of the Workspace to retrieve
   * @return {Promise<Acl>} - The response object that contains the Workspace
   * @example
   *
   * const ref = "00000000-0000-0000-0000-000000000000"
   *
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * workspaces.getWorkspace(ref)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
  async getWorkspace(ref: string): Promise<Workspace> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      GetWorkspaceRequestPB,
      WorkspacePB,
      BaseApiObject,
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

  /**
   * Deletes an existing Workspace from Fonoster.
   * Note that this operation is irreversible.
   *
   * @param {string} ref - The reference of the Workspace to delete
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the deleted Workspace
   * @example
   *
   * const ref =  "00000000-0000-0000-0000-000000000000"
   *
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * workspaces.deleteWorkspace(ref)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
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

  /**
   * Retrieves a list of Workspaces from a Workspace.
   *
   * @param {ListWorkspacesRequest} request - The request object that contains the necessary information to retrieve a list of Workspaces
   * @param {number} request.pageSize - The workspace of Workspaces to retrieve
   * @param {string} request.pageToken - The token to retrieve the next page of Workspaces
   * @return {Promise<ListWorkspacesResponse>} - The response object that contains the list of Workspaces
   * @example
   *
   * const request = {
   *  pageSize: 10,
   *  pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * workspaces.listWorkspaces(request)
   *  .then(console.log) // successful response
   *  .catch(console.error); // an error occurred
   */
  async listWorkspaces(): Promise<ListWorkspacesResponse> {
    const applicationsClient = this.client.getIdentityClient();
    return await makeRpcRequest<
      ListWorkspacesRequestPB,
      ListWorkspacesResponsePB,
      Record<string, never>,
      ListWorkspacesResponse
    >({
      method: applicationsClient.listWorkspaces.bind(applicationsClient),
      requestPBObjectConstructor: ListWorkspacesRequestPB,
      metadata: this.client.getMetadata(),
      request: {},
      repeatableObjectMapping: [["itemsList", WorkspacePB]]
    });
  }

  async inviteUserToWorkspace(
    request: InviteUserToWorkspaceRequest
  ): Promise<BaseApiObject> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      InviteUserToWorkspaceRequestPB,
      InviteUserToWorkspaceResponsePB,
      InviteUserToWorkspaceRequest,
      BaseApiObject
    >({
      method: client.inviteUserToWorkspace.bind(client),
      requestPBObjectConstructor: InviteUserToWorkspaceRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async resendWorkspaceMembershipInvitation(
    request: ResendWorkspaceMembershipInvitationRequest
  ): Promise<ResendWorkspaceMembershipInvitationResponse> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      ResendWorkspaceMembershipInvitationRequestPB,
      ResendWorkspaceMembershipInvitationResponsePB,
      ResendWorkspaceMembershipInvitationRequest,
      ResendWorkspaceMembershipInvitationResponse
    >({
      method: client.resendWorkspaceMembershipInvitation.bind(client),
      requestPBObjectConstructor: ResendWorkspaceMembershipInvitationRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async removeUserFromWorkspace(
    request: RemoveUserFromWorkspaceRequest
  ): Promise<RemoveUserFromWorkspaceResponse> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      RemoveUserFromWorkspaceRequestPB,
      RemoveUserFromWorkspaceResponsePB,
      RemoveUserFromWorkspaceRequest,
      RemoveUserFromWorkspaceResponse
    >({
      method: client.removeUserFromWorkspace.bind(client),
      requestPBObjectConstructor: RemoveUserFromWorkspaceRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }
}

export { Workspaces };
