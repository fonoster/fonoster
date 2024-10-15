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
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  InviteUserToWorkspaceRequest,
  InviteUserToWorkspaceResponse,
  WorkspaceMemberStatus
} from "@fonoster/types";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { customAlphabet } from "nanoid";
import { createSendEmail } from "./createSendEmail";
import { isAdminMember } from "./isAdminMember";
import { isWorkspaceMember } from "./isWorkspaceMember";
import { Prisma } from "../db";
import {
  IDENTITY_WORKSPACE_INVITATION_URL,
  IDENTITY_WORKSPACE_INVITE_EXPIRATION
} from "../envs";
import { IdentityConfig } from "../exchanges/types";
import { SendInvite } from "../invites/sendInvite";
import {
  AccessKeyIdType,
  generateAccessKeyId,
  getAccessKeyIdFromCall
} from "../utils";
import { createWorkspaceInviteToken } from "../utils/createWorkspaceInviteToken";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

const userIsMemberError = {
  code: GRPCStatus.ALREADY_EXISTS,
  message: "User is already a member of this workspace"
};

const inviterIsNotAdminError = {
  code: GRPCStatus.PERMISSION_DENIED,
  message: "Only admins or owners can invite users to a workspace"
};

const findUserByEmail = async (prisma: Prisma, email: string) => {
  return await prisma.user.findUnique({
    where: {
      email
    }
  });
};

const createUser = (prisma: Prisma) => {
  return async (request: InviteUserToWorkspaceRequest) => {
    const { name, email, password } = request;

    return await prisma.user.create({
      data: {
        name,
        email,
        accessKeyId: generateAccessKeyId(AccessKeyIdType.USER),
        password
      }
    });
  };
};

function inviteUserToWorkspace(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  sendInvite: SendInvite
) {
  const fn = async (
    call: { request: InviteUserToWorkspaceRequest },
    callback: (
      error: GrpcErrorMessage,
      response?: InviteUserToWorkspaceResponse
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
    const { email, name, role } = request;

    logger.verbose("inviting user to workspace", {
      workspaceRef,
      email,
      role
    });

    const isAdmin = await isAdminMember(prisma)(workspaceRef, adminRef);

    if (!isAdmin) {
      return callback(inviterIsNotAdminError);
    }

    let user = await findUserByEmail(prisma, email);

    const isMember = await isWorkspaceMember(prisma)(workspaceRef, user?.ref);

    if (isMember) {
      return callback(userIsMemberError);
    }

    const oneTimePassword = customAlphabet("1234567890abcdef", 10)();

    let isExistingUser = true;

    if (!user) {
      isExistingUser = false;

      user = await createUser(prisma)({
        name,
        email,
        password: oneTimePassword,
        role
      });
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        userRef: user.ref,
        workspaceRef,
        role,
        status: WorkspaceMemberStatus.PENDING
      },
      include: {
        workspace: true
      }
    });

    const inviteeToken = await createWorkspaceInviteToken(identityConfig)({
      userRef: user.ref,
      memberRef: newMember.ref,
      accessKeyId: user.accessKeyId,
      expiresIn: IDENTITY_WORKSPACE_INVITE_EXPIRATION
    });

    await sendInvite(createSendEmail(identityConfig), {
      recipient: email,
      oneTimePassword,
      workspaceName: newMember.workspace.name,
      isExistingUser,
      inviteUrl: `${IDENTITY_WORKSPACE_INVITATION_URL}?token=${inviteeToken}`
    });

    callback(null, {
      userRef: user?.ref,
      workspaceRef
    });
  };

  return withErrorHandlingAndValidation(
    fn,
    V.inviteUserToWorkspaceRequestSchema
  );
}

export { inviteUserToWorkspace };
