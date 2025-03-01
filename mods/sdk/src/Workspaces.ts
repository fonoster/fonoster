/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
  ListWorkspaceMembersRequest,
  ListWorkspaceMembersResponse,
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
  ListWorkspaceMembersRequest as ListWorkspaceMembersRequestPB,
  ListWorkspaceMembersResponse as ListWorkspaceMembersResponsePB,
  ListWorkspacesRequest as ListWorkspacesRequestPB,
  ListWorkspacesResponse as ListWorkspacesResponsePB,
  RemoveUserFromWorkspaceRequest as RemoveUserFromWorkspaceRequestPB,
  RemoveUserFromWorkspaceResponse as RemoveUserFromWorkspaceResponsePB,
  ResendWorkspaceMembershipInvitationRequest as ResendWorkspaceMembershipInvitationRequestPB,
  ResendWorkspaceMembershipInvitationResponse as ResendWorkspaceMembershipInvitationResponsePB,
  UpdateWorkspaceRequest as UpdateWorkspaceRequestPB,
  UpdateWorkspaceResponse as UpdateWorkspaceResponsePB,
  WorkspaceMember as WorkspaceMemberPB,
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
 *   const apiKey = "your-api-key";
 *   const apiSecret = "your-api-secret"
 *   const accessKeyId = "WO00000000000000000000000000000000";
 *
 *   try {
 *     const client = SDK.Client({ accessKeyId });
 *     await client.loginWithApiKey(apiKey, apiSecret);
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
 * main(request);
 */
class Workspaces {
  private readonly client: FonosterClient;
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

  /**
   * Creates a new Workspace in the system.
   *
   * @param {CreateWorkspaceRequest} request - The request object that contains the necessary information to create a new Workspace
   * @param {string} request.name - The name of the Workspace
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the created Workspace
   * @example
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const request = {
   *   name: "My Workspace"
   * };
   *
   * workspaces
   *   .createWorkspace(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * workspaces
   *   .getWorkspace(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
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

  /**
   * Updates an existing Workspace in the system.
   *
   * @param {UpdateWorkspaceRequest} request - The request object that contains the necessary information to update a Workspace
   * @param {string} request.ref - The reference of the Workspace to update
   * @param {string} request.name - The name of the Workspace
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the updated Workspace
   * @example
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const request = {
   *   ref: "00000000-0000-0000-0000-000000000000",
   *   name: "My Workspace"
   * };
   *
   * workspaces
   *   .updateWorkspace(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const ref = "00000000-0000-0000-0000-000000000000";
   *
   * workspaces
   *   .deleteWorkspace(ref)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
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
   * Retrieves a list of all Workspaces for the logged in user.
   *
   * @return {Promise<ListWorkspacesResponse>} - The response object that contains the list of Workspaces
   * @example
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * workspaces
   *   .listWorkspaces()
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
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

  /**
   * Invites a User to a Workspace.
   *
   * @param {InviteUserToWorkspaceRequest} request - The request object that contains the necessary information to invite a User to a Workspace
   * @param {string} request.workspaceRef - The reference of the Workspace to invite the User to
   * @param {string} request.email - The email of the User to invite
   * @param {string} request.password - Temporary password for the User. Leave empty to generate a random password
   * @return {Promise<BaseApiObject>} - The response object that contains the reference to the invitation
   * @example
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const request = {
   *   workspaceRef: "00000000-0000-0000-0000-000000000000",
   *   email: "jane.doe@example.com",
   *   role: "WORKSPACE_MEMBER",
   *   password: "password" // Temporary password for the User. Leave empty to generate a random password
   * };
   *
   * workspaces
   *   .inviteUserToWorkspace(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
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

  /**
   * Resend a Workspace membership invitation.
   *
   * @param {string} userRef - The reference to the user to resend the invitation
   * @return {Promise<ResendWorkspaceMembershipInvitationResponse>} - The response object that contains the reference to the invitation
   * @example
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const userRef: "00000000-0000-0000-0000-000000000000";
   *
   * workspaces
   *   .resendWorkspaceMembershipInvitation(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async resendWorkspaceMembershipInvitation(
    userRef: string
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
      request: { userRef }
    });
  }

  /**
   * List the members of a Workspace
   *
   * @param {ListWorkspaceMembersRequest} request - Request object to list the members of a Workspace
   * @param {number} request.pageSize - The number of members to return in the response
   * @param {string} request.pageToken - The page token to return the next page of members
   * @return {Promise<ListWorkspaceMembersResponse>} - The response object that contains the list of members
   * @example
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const request = {
   *   pageSize: 10,
   *   pageToken: "00000000-0000-0000-0000-000000000000"
   * };
   *
   * workspaces
   *   .listWorkspaceMembers(request)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async listWorkspaceMembers(
    request: ListWorkspaceMembersRequest
  ): Promise<ListWorkspaceMembersResponse> {
    const client = this.client.getIdentityClient();
    return await makeRpcRequest<
      ListWorkspaceMembersRequestPB,
      ListWorkspaceMembersResponsePB,
      ListWorkspaceMembersRequest,
      ListWorkspaceMembersResponse
    >({
      method: client.listWorkspaceMembers.bind(client),
      requestPBObjectConstructor: ListWorkspaceMembersRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", WorkspaceMemberPB]]
    });
  }

  /**
   * Removes a User from a Workspace.
   *
   * @param {string} userRef - The reference of the User to remove from the Workspace
   * @return {Promise<RemoveUserFromWorkspaceResponse>} - The response object that contains the reference to the removed User
   * @example
   * const workspaces = new SDK.Workspaces(client); // Existing client object
   *
   * const userRef = "00000000-0000-0000-0000-000000000000";
   *
   * workspaces
   *   .removeUserFromWorkspace(userRef)
   *   .then(console.log) // successful response
   *   .catch(console.error); // an error occurred
   */
  async removeUserFromWorkspace(
    userRef: string
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
      request: { userRef }
    });
  }
}

export { Workspaces };
