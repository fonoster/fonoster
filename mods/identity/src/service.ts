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
import { prisma } from "./db";
import { IdentityConfig } from "./exchanges/types";
import {
  createAPIKey,
  createUser,
  createWorkspace,
  deleteAPIKey,
  deleteUser,
  deleteWorkspace,
  exchangeAPIKey,
  exchangeCredentials,
  exchangeRefreshToken,
  getUser,
  getWorkspace,
  inviteUserToWorkspace,
  listAPIKeys,
  listWorkspaces,
  regenerateAPIKey,
  removeUserFromWorkspace,
  resendWorkspaceMembershipInvitation,
  sendInvite,
  updateUser,
  updateWorkspace
} from ".";

function buildIdentityService(identityConfig: IdentityConfig) {
  return {
    definition: {
      serviceName: "Identity",
      pckg: "identity",
      version: "v1beta2",
      proto: "identity.proto"
    },
    handlers: {
      // Workspace operations
      createWorkspace: createWorkspace(prisma),
      deleteWorkspace: deleteWorkspace(prisma),
      getWorkspace: getWorkspace(prisma),
      updateWorkspace: updateWorkspace(prisma),
      listWorkspaces: listWorkspaces(prisma),
      inviteUserToWorkspace: inviteUserToWorkspace(
        prisma,
        identityConfig,
        sendInvite
      ),
      resendWorkspaceMembershipInvitation: resendWorkspaceMembershipInvitation(
        prisma,
        identityConfig,
        sendInvite
      ),
      removeUserFromWorkspace: removeUserFromWorkspace(prisma),
      // User operations
      createUser: createUser(prisma),
      getUser: getUser(prisma),
      deleteUser: deleteUser(prisma),
      updateUser: updateUser(prisma),
      // API Key operations
      createApiKey: createAPIKey(prisma),
      deleteApiKey: deleteAPIKey(prisma),
      listApiKeys: listAPIKeys(prisma),
      regenerateApiKey: regenerateAPIKey(prisma),
      // Exchanges
      exchangeApiKey: exchangeAPIKey(prisma, identityConfig),
      exchangeCredentials: exchangeCredentials(prisma, identityConfig),
      exchangeRefreshToken: exchangeRefreshToken(prisma, identityConfig)
    }
  };
}

export { buildIdentityService };
