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
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  CreateUserRequest,
  CreateUserResponse,
  CreateWorkspaceRequest,
  DeleteApiKeyRequest,
  DeleteApiKeyResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  DeleteWorkspaceRequest,
  DeleteWorkspaceResponse,
  ExchangeApiKeyRequest,
  ExchangeApiKeyResponse,
  ExchangeCredentialsRequest,
  ExchangeCredentialsResponse,
  ExchangeRefreshTokenRequest,
  ExchangeRefreshTokenResponse,
  GetUserRequest,
  GetWorkspaceRequest,
  InviteUserToWorkspaceRequest,
  InviteUserToWorkspaceResponse,
  ListApiKeysRequest,
  ListApiKeysResponse,
  ListWorkspacesRequest,
  ListWorkspacesResponse,
  RegenerateApiKeyRequest,
  RegenerateApiKeyResponse,
  RemoveUserFromWorkspaceRequest,
  RemoveUserFromWorkspaceResponse,
  ResendWorkspaceMembershipInvitationRequest,
  ResendWorkspaceMembershipInvitationResponse,
  UpdateUserRequest,
  UpdateWorkspaceRequest,
  UpdateWorkspaceResponse,
  User,
  Workspace
} from "../../generated/web/identity_pb";
import { ClientFunction } from "../types";

type IdentityClient = {
  // ApiKeys
  createApiKey: ClientFunction<CreateApiKeyRequest, CreateApiKeyResponse>;
  regenerateApiKey: ClientFunction<
    RegenerateApiKeyRequest,
    RegenerateApiKeyResponse
  >;
  listApiKeys: ClientFunction<ListApiKeysRequest, ListApiKeysResponse>;
  deleteApiKey: ClientFunction<DeleteApiKeyRequest, DeleteApiKeyResponse>;
  // Exchanges
  exchangeApiKey: ClientFunction<ExchangeApiKeyRequest, ExchangeApiKeyResponse>;
  exchangeCredentials: ClientFunction<
    ExchangeCredentialsRequest,
    ExchangeCredentialsResponse
  >;
  exchangeRefreshToken: ClientFunction<
    ExchangeRefreshTokenRequest,
    ExchangeRefreshTokenResponse
  >;
  // User
  createUser: ClientFunction<CreateUserRequest, CreateUserResponse>;
  getUser: ClientFunction<GetUserRequest, User>;
  updateUser: ClientFunction<UpdateUserRequest, CreateUserResponse>;
  deleteUser: ClientFunction<DeleteUserRequest, DeleteUserResponse>;
  // Workspaces
  createWorkspace: ClientFunction<CreateWorkspaceRequest, CreateUserResponse>;
  getWorkspace: ClientFunction<GetWorkspaceRequest, Workspace>;
  listWorkspaces: ClientFunction<ListWorkspacesRequest, ListWorkspacesResponse>;
  updateWorkspace: ClientFunction<
    UpdateWorkspaceRequest,
    UpdateWorkspaceResponse
  >;
  inviteUserToWorkspace: ClientFunction<
    InviteUserToWorkspaceRequest,
    InviteUserToWorkspaceResponse
  >;
  resendWorkspaceMembershipInvitation: ClientFunction<
    ResendWorkspaceMembershipInvitationRequest,
    ResendWorkspaceMembershipInvitationResponse
  >;
  removeUserFromWorkspace: ClientFunction<
    RemoveUserFromWorkspaceRequest,
    RemoveUserFromWorkspaceResponse
  >;
  deleteWorkspace: ClientFunction<
    DeleteWorkspaceRequest,
    DeleteWorkspaceResponse
  >;
};

export { IdentityClient };
