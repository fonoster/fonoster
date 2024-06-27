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
import { GRPCErrorMessage, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { createSendEmail } from "./createSendEmail";
import { isAdminMember } from "./isAdminMember";
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { SendInvite } from "../invites/sendInvite";
import { getAccessKeyIdFromCall } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

type ResendWorkspaceMembershipInvitationRequest = {
  userRef: string;
};

type ResendWorkspaceMembershipInvitationResponse = {
  userRef: string;
};

function resendWorkspaceMembershipInvitation(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  sendInvite: SendInvite
) {
  return async (
    call: { request: ResendWorkspaceMembershipInvitationRequest },
    callback: (
      error: GRPCErrorMessage,
      response?: ResendWorkspaceMembershipInvitationResponse
    ) => void
  ) => {
    try {
      const { userRef: inviteeRef } = call.request;
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const adminRef = getUserRefFromToken(token);
      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      const workspace = await prisma.workspace.findUnique({
        where: {
          accessKeyId
        }
      });
      const workspaceRef = workspace.ref;

      logger.verbose("resending workspace membership invitation", {
        workspaceRef,
        inviteeRef,
        adminRef
      });

      const isAdmin = await isAdminMember(prisma)(workspace.ref, adminRef);

      if (!isAdmin) {
        return callback({
          code: GRPCStatus.PERMISSION_DENIED,
          message: "Only admins and owners can resend workspace invitations"
        });
      }

      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceRef,
          userRef: inviteeRef
        },
        include: {
          user: true,
          workspace: true
        }
      });

      if (!member) {
        return callback({
          code: GRPCStatus.NOT_FOUND,
          message: `Original invitation not found for userRef: ${inviteeRef}`
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
        userRef: inviteeRef
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { resendWorkspaceMembershipInvitation };
