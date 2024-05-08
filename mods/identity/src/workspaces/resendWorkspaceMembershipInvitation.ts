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
import { GRPCErrors, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { createSendEmail } from "./createSendEmail";
import { isAdminMember } from "./isAdminMember";
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { SendInvite } from "../invites/sendInvite";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

type ResendWorkspaceMembershipInvitationRequest = {
  workspaceId: string;
  userId: string;
};

type ResendWorkspaceMembershipInvitationResponse = {
  workspaceId: string;
  userId: string;
};

function resendWorkspaceMembershipInvitation(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  sendInvite: SendInvite
) {
  return async (
    call: { request: ResendWorkspaceMembershipInvitationRequest },
    callback: (
      error: GRPCErrors,
      response?: ResendWorkspaceMembershipInvitationResponse
    ) => void
  ) => {
    try {
      const { workspaceId, userId } = call.request;
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const adminId = getUserIdFromToken(token);

      logger.debug("removing workspace member", {
        workspaceId,
        userId,
        adminId
      });

      const isAdmin = await isAdminMember(prisma)(workspaceId, adminId);

      if (!isAdmin && adminId !== userId) {
        return callback({
          code: GRPCStatus.PERMISSION_DENIED,
          message: "Only admins or owners can remove users from a workspace"
        });
      }

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId
        },
        include: {
          user: true,
          workspace: true
        }
      });

      if (!member) {
        return callback({
          code: GRPCStatus.NOT_FOUND,
          message: "User not found in workspace"
        });
      }

      await sendInvite(createSendEmail(identityConfig), {
        recipient: member.user.email,
        oneTimePassword: member.user.password,
        workspaceName: member.workspace.name,
        isExistingUser: true,
        // TODO: Create inviteUrl with invite token
        inviteUrl: "https://placehold.it?token=jwt"
      });

      callback(null, {
        workspaceId,
        userId
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { resendWorkspaceMembershipInvitation };
