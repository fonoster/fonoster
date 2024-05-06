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
import { GroupRoleEnum } from "./groups/GroupRoleEnum";

const roles = [
  {
    name: GroupRoleEnum.OWNER,
    description: "Access to all endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateGroup",
      "/fonoster.identity.v1beta2.Identity/GetGroupById",
      "/fonoster.identity.v1beta2.Identity/UpdateGroup",
      "/fonoster.identity.v1beta2.Identity/ListGroups",
      "/fonoster.identity.v1beta2.Identity/InviteUserToGroup",
      "/fonoster.identity.v1beta2.Identity/RemoveUserFromGroup",
      "/fonoster.identity.v1beta2.Identity/ResendGroupMembershipInvitation",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.identity.v1beta2.Identity/CreateAPIKey",
      "/fonoster.identity.v1beta2.Identity/DeleteAPIKey",
      "/fonoster.identity.v1beta2.Identity/ListAPIKeys",
      "/fonoster.identity.v1beta2.Identity/RegenerateAPIKey",
      "/fonoster.domains.v1beta2.Domains/CreateDomain"
    ]
  },
  {
    name: GroupRoleEnum.ADMIN,
    description: "Access to all endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateGroup",
      "/fonoster.identity.v1beta2.Identity/GetGroupById",
      "/fonoster.identity.v1beta2.Identity/UpdateGroup",
      "/fonoster.identity.v1beta2.Identity/ListGroups",
      "/fonoster.identity.v1beta2.Identity/InviteUserToGroup",
      "/fonoster.identity.v1beta2.Identity/RemoveUserFromGroup",
      "/fonoster.identity.v1beta2.Identity/ResendGroupMembershipInvitation",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.identity.v1beta2.Identity/CreateAPIKey",
      "/fonoster.identity.v1beta2.Identity/DeleteAPIKey",
      "/fonoster.identity.v1beta2.Identity/ListAPIKeys",
      "/fonoster.identity.v1beta2.Identity/RegenerateAPIKey",
      "/fonoster.domains.v1beta2.Domains/CreateDomain"
    ]
  },
  {
    name: APIRoleEnum.GROUP_ADMIN,
    description: "Access to all endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateGroup",
      "/fonoster.identity.v1beta2.Identity/GetGroupById",
      "/fonoster.identity.v1beta2.Identity/UpdateGroup",
      "/fonoster.identity.v1beta2.Identity/ListGroups",
      "/fonoster.identity.v1beta2.Identity/InviteUserToGroup",
      "/fonoster.identity.v1beta2.Identity/RemoveUserFromGroup",
      "/fonoster.identity.v1beta2.Identity/ResendGroupMembershipInvitation",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.identity.v1beta2.Identity/CreateAPIKey",
      "/fonoster.identity.v1beta2.Identity/DeleteAPIKey",
      "/fonoster.identity.v1beta2.Identity/ListAPIKeys",
      "/fonoster.identity.v1beta2.Identity/RegenerateAPIKey",
      "/fonoster.domains.v1beta2.Domains/CreateDomain"
    ]
  },
  {
    name: GroupRoleEnum.USER,
    description: "Access to User and Workspace endpoints",
    access: [
      "/fonoster.identity.v1beta2.Identity/GetUserById",
      "/fonoster.identity.v1beta2.Identity/UpdateUser",
      "/fonoster.identity.v1beta2.Identity/DeleteUser",
      "/fonoster.identity.v1beta2.Identity/CreateGroup",
      "/fonoster.identity.v1beta2.Identity/GetGroupById",
      "/fonoster.identity.v1beta2.Identity/UpdateGroup",
      "/fonoster.identity.v1beta2.Identity/ListGroups",
      "/fonoster.identity.v1beta2.Identity/RefreshToken",
      "/fonoster.domains.v1beta2.Domains/CreateDomain"
    ]
  }
] as Role[];

export default roles;
