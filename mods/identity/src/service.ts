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
import { createPrismaClient } from "./db";
import { createExchangeOauth2Code } from "./exchanges/createExchangeOauth2Code";
import { IdentityConfig } from "./exchanges/types";
import { createGetPublicKey } from "./getPublicKey";
import { createSendVerificationCode, createVerifyCode } from "./verification";
import {
  createCreateApiKey,
  createCreateUser,
  createCreateUserWithOauth2Code,
  createCreateWorkspace,
  createDeleteApiKey,
  createDeleteUser,
  createDeleteWorkspace,
  createExchangeApiKey,
  createExchangeCredentials,
  createExchangeRefreshToken,
  createGetUser,
  createGetWorkspace,
  createInviteUserToWorkspace,
  createListApiKeys,
  createListWorkspaceMembers,
  createListWorkspaces,
  createRegenerateApiKey,
  createRemoveUserFromWorkspace,
  createResendWorkspaceMembershipInvitation,
  createResetPassword,
  createSendResetPasswordCode,
  createUpdateUser,
  createUpdateWorkspace,
  sendInvite
} from ".";

const serviceDefinitionParams = {
  serviceName: "Identity",
  pckg: "identity",
  proto: "identity.proto",
  version: "v1beta2"
};

function buildIdentityService(identityConfig: IdentityConfig) {
  const prisma = createPrismaClient(
    identityConfig.dbUrl,
    identityConfig.encryptionKey
  );

  const service = {
    definition: serviceDefinitionParams,
    handlers: {
      // Workspace operations
      createWorkspace: createCreateWorkspace(prisma),
      deleteWorkspace: createDeleteWorkspace(prisma),
      getWorkspace: createGetWorkspace(prisma),
      updateWorkspace: createUpdateWorkspace(prisma),
      listWorkspaces: createListWorkspaces(prisma),
      listWorkspaceMembers: createListWorkspaceMembers(prisma),
      inviteUserToWorkspace: createInviteUserToWorkspace(
        prisma,
        identityConfig,
        sendInvite
      ),
      resendWorkspaceMembershipInvitation:
        createResendWorkspaceMembershipInvitation(
          prisma,
          identityConfig,
          sendInvite
        ),
      removeUserFromWorkspace: createRemoveUserFromWorkspace(prisma),
      // User operations
      createUser: createCreateUser(prisma),
      createUserWithOauth2Code: createCreateUserWithOauth2Code(
        prisma,
        identityConfig
      ),
      getUser: createGetUser(prisma),
      deleteUser: createDeleteUser(prisma),
      updateUser: createUpdateUser(prisma),
      sendResetPasswordCode: createSendResetPasswordCode(
        prisma,
        identityConfig
      ),
      resetPassword: createResetPassword(prisma),
      // ApiKey operations
      createApiKey: createCreateApiKey(prisma),
      deleteApiKey: createDeleteApiKey(prisma),
      listApiKeys: createListApiKeys(prisma),
      regenerateApiKey: createRegenerateApiKey(prisma),
      // Exchanges
      exchangeApiKey: createExchangeApiKey(prisma, identityConfig),
      exchangeCredentials: createExchangeCredentials(prisma, identityConfig),
      exchangeOauth2Code: createExchangeOauth2Code(prisma, identityConfig),
      exchangeRefreshToken: createExchangeRefreshToken(prisma, identityConfig),
      getPublicKey: createGetPublicKey(identityConfig.publicKey),
      // Placeholders for conditional handlers
      sendVerificationCode: undefined as unknown as ReturnType<
        typeof createSendVerificationCode
      >,
      verifyCode: undefined as unknown as ReturnType<typeof createVerifyCode>
    }
  };

  if (
    identityConfig.contactVerificationRequired ||
    identityConfig.twoFactorAuthenticationRequired
  ) {
    service.handlers.sendVerificationCode = createSendVerificationCode(
      prisma,
      identityConfig
    );
    service.handlers.verifyCode = createVerifyCode(prisma);
  }

  return service;
}

export { buildIdentityService, serviceDefinitionParams };
