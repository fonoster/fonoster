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
  assertEnvsAreSet,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  ResendWorkspaceMembershipInvitationRequest,
  ResendWorkspaceMembershipInvitationResponse
} from "@fonoster/types";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { isAdminMember } from "./isAdminMember";
import { Prisma } from "../db";
import {
  IDENTITY_WORKSPACE_INVITATION_URL,
  IDENTITY_WORKSPACE_INVITE_EXPIRATION
} from "../envs";
import { IdentityConfig } from "../exchanges/types";
import { SendInvite } from "../invites";
import { createSendEmail, getAccessKeyIdFromCall } from "../utils";
import { createWorkspaceInviteToken } from "../utils/createWorkspaceInviteToken";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

assertEnvsAreSet(["IDENTITY_WORKSPACE_INVITATION_URL"]);

function resendWorkspaceMembershipInvitation(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  sendInvite: SendInvite
) {
  const fn = async (
    call: { request: ResendWorkspaceMembershipInvitationRequest },
    callback: (
      error: GrpcErrorMessage,
      response?: ResendWorkspaceMembershipInvitationResponse
    ) => void
  ) => {
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

    const { ref: workspaceRef } = workspace;
    const { request } = call;
    const { userRef: inviteeRef } = request;

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

    const inviteeToken = await createWorkspaceInviteToken(identityConfig)({
      userRef: member.user.ref,
      memberRef: member.ref,
      accessKeyId: member.user.accessKeyId,
      expiresIn: IDENTITY_WORKSPACE_INVITE_EXPIRATION
    });

    await sendInvite(createSendEmail(identityConfig), {
      recipient: member.user.email,
      oneTimePassword: member.user.password,
      workspaceName: member.workspace.name,
      isExistingUser: true,
      inviteUrl: `${IDENTITY_WORKSPACE_INVITATION_URL}?token=${inviteeToken}`
    });

    callback(null, {
      userRef: inviteeRef
    });
  };

  return withErrorHandlingAndValidation(
    fn,
    V.resendWorkspaceMembershipInvitationRequestSchema
  );
}

export { resendWorkspaceMembershipInvitation };
