/* eslint-disable sonarjs/no-duplicate-string */
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
import { APIRoleEnum } from "./apikeys";
import { Role } from "./exchanges/types";
import { WorkspaceRoleEnum } from "./workspaces/WorkspaceRoleEnum";

const roles = [
  {
    name: WorkspaceRoleEnum.OWNER,
    description: "Access to all endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateWorkspace",
      "/fonoster.identity.v1beta2.Identity/GetWorkspaceById",
      "/fonoster.identity.v1beta2.Identity/UpdateWorkspace",
      "/fonoster.identity.v1beta2.Identity/ListWorkspaces",
      "/fonoster.identity.v1beta2.Identity/InviteUserToWorkspace",
      "/fonoster.identity.v1beta2.Identity/RemoveUserFromWorkspace",
      "/fonoster.identity.v1beta2.Identity/ResendWorkspaceMembershipInvitation",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.identity.v1beta2.Identity/CreateAPIKey",
      "/fonoster.identity.v1beta2.Identity/DeleteAPIKey",
      "/fonoster.identity.v1beta2.Identity/ListAPIKeys",
      "/fonoster.identity.v1beta2.Identity/RegenerateAPIKey",
      "/fonoster.domains.v1beta2.Domains/CreateDomain",
      "/fonoster.domains.v1beta2.Domains/UpdateDomain",
      "/fonoster.domains.v1beta2.Domains/GetDomain",
      "/fonoster.domains.v1beta2.Domains/DeleteDomain",
      "/fonoster.domains.v1beta2.Domains/ListDomains"
    ]
  },
  {
    name: WorkspaceRoleEnum.ADMIN,
    description: "Access to all endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateWorkspace",
      "/fonoster.identity.v1beta2.Identity/GetWorkspaceById",
      "/fonoster.identity.v1beta2.Identity/UpdateWorkspace",
      "/fonoster.identity.v1beta2.Identity/ListWorkspaces",
      "/fonoster.identity.v1beta2.Identity/InviteUserToWorkspace",
      "/fonoster.identity.v1beta2.Identity/RemoveUserFromWorkspace",
      "/fonoster.identity.v1beta2.Identity/ResendWorkspaceMembershipInvitation",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.identity.v1beta2.Identity/CreateAPIKey",
      "/fonoster.identity.v1beta2.Identity/DeleteAPIKey",
      "/fonoster.identity.v1beta2.Identity/ListAPIKeys",
      "/fonoster.identity.v1beta2.Identity/RegenerateAPIKey",
      "/fonoster.domains.v1beta2.Domains/CreateDomain",
      "/fonoster.domains.v1beta2.Domains/UpdateDomain",
      "/fonoster.domains.v1beta2.Domains/GetDomain",
      "/fonoster.domains.v1beta2.Domains/DeleteDomain",
      "/fonoster.domains.v1beta2.Domains/ListDomains"
    ]
  },
  {
    name: APIRoleEnum.WORKSPACE_ADMIN,
    description: "Access to all endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateWorkspace",
      "/fonoster.identity.v1beta2.Identity/GetWorkspaceById",
      "/fonoster.identity.v1beta2.Identity/UpdateWorkspace",
      "/fonoster.identity.v1beta2.Identity/ListWorkspaces",
      "/fonoster.identity.v1beta2.Identity/InviteUserToWorkspace",
      "/fonoster.identity.v1beta2.Identity/RemoveUserFromWorkspace",
      "/fonoster.identity.v1beta2.Identity/ResendWorkspaceMembershipInvitation",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.identity.v1beta2.Identity/CreateAPIKey",
      "/fonoster.identity.v1beta2.Identity/DeleteAPIKey",
      "/fonoster.identity.v1beta2.Identity/ListAPIKeys",
      "/fonoster.identity.v1beta2.Identity/RegenerateAPIKey",
      "/fonoster.domains.v1beta2.Domains/CreateDomain",
      "/fonoster.domains.v1beta2.Domains/UpdateDomain",
      "/fonoster.domains.v1beta2.Domains/GetDomain",
      "/fonoster.domains.v1beta2.Domains/DeleteDomain",
      "/fonoster.domains.v1beta2.Domains/ListDomains"
    ]
  },
  {
    name: WorkspaceRoleEnum.USER,
    description: "Access to User and Workspace endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateWorkspace",
      "/fonoster.identity.v1beta2.Identity/GetWorkspaceById",
      "/fonoster.identity.v1beta2.Identity/UpdateWorkspace",
      "/fonoster.identity.v1beta2.Identity/ListWorkspaces",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.domains.v1beta2.Domains/CreateDomain",
      "/fonoster.domains.v1beta2.Domains/UpdateDomain",
      "/fonoster.domains.v1beta2.Domains/GetDomain",
      "/fonoster.domains.v1beta2.Domains/DeleteDomain",
      "/fonoster.domains.v1beta2.Domains/ListDomains"
    ]
  }
] as Role[];

export default roles;
