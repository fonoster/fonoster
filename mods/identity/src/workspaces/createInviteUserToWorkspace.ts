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
  getAccessKeyIdFromCall,
  getTokenFromCall,
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
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { SendInvite } from "../invites";
import {
  AccessKeyIdType,
  createSendEmail,
  generateAccessKeyId
} from "../utils";
import { createGenerateWorkspaceInviteToken } from "../utils/createGenerateWorkspaceInviteToken";
import { getUserRefFromToken } from "../utils/getUserRefFromToken";
import { createIsAdminMember } from "./createIsAdminMember";
import { createIsWorkspaceMember } from "./createIsWorkspaceMember";

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

const createCreateUser = (prisma: Prisma) => {
  return async function createUser(request: InviteUserToWorkspaceRequest) {
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

function createInviteUserToWorkspace(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  sendInvite: SendInvite
) {
  const inviteUserToWorkspace = async (
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
    // Brand logins are created by our portal. They must be active immediately
    // and must not depend on the invite email being delivered.
    const serviceLogin =
      /^[a-z0-9-]+\.voice@users\.intelli-verse-x\.ai$/i.test(email);

    logger.verbose("inviting user to workspace", {
      workspaceRef,
      email,
      role,
      serviceLogin
    });

    const isAdmin = await createIsAdminMember(prisma)(workspaceRef, adminRef);

    if (!isAdmin) {
      return callback(inviterIsNotAdminError);
    }

    let user = await findUserByEmail(prisma, email);

    const isMember = await createIsWorkspaceMember(prisma)(
      workspaceRef,
      user?.ref
    );

    if (isMember) {
      if (serviceLogin && user?.ref) {
        return callback(null, { userRef: user.ref, workspaceRef });
      }
      return callback(userIsMemberError);
    }

    const oneTimePassword = customAlphabet("1234567890abcdef", 10)();

    let isExistingUser = true;

    if (!user) {
      isExistingUser = false;

      user = await createCreateUser(prisma)({
        name,
        email,
        password: oneTimePassword,
        role
      });
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userRef_workspaceRef: {
          userRef: user.ref,
          workspaceRef
        }
      }
    });
    // Brand voice logins are often left PENDING after a UI invite or a failed
    // SES send. Activate them here — do not treat PENDING as "already a member"
    // and do not attempt a second insert (unique on userRef+workspaceRef).
    if (existingMember) {
      if (serviceLogin) {
        if (existingMember.status !== WorkspaceMemberStatus.ACTIVE) {
          await prisma.workspaceMember.update({
            where: { ref: existingMember.ref },
            data: {
              status: WorkspaceMemberStatus.ACTIVE,
              updatedAt: new Date()
            }
          });
          logger.verbose("activated pending brand voice workspace member", {
            workspaceRef,
            email,
            memberRef: existingMember.ref
          });
        }
        return callback(null, { userRef: user.ref, workspaceRef });
      }
      return callback(userIsMemberError);
    }

    let newMember;
    try {
      newMember = await prisma.workspaceMember.create({
        data: {
          userRef: user.ref,
          workspaceRef,
          role,
          status: serviceLogin
            ? WorkspaceMemberStatus.ACTIVE
            : WorkspaceMemberStatus.PENDING
        },
        include: {
          workspace: true
        }
      });
    } catch (error) {
      // Race: another invite created the row between findUnique and create.
      if (serviceLogin) {
        const raced = await prisma.workspaceMember.findUnique({
          where: {
            userRef_workspaceRef: {
              userRef: user.ref,
              workspaceRef
            }
          }
        });
        if (raced) {
          if (raced.status !== WorkspaceMemberStatus.ACTIVE) {
            await prisma.workspaceMember.update({
              where: { ref: raced.ref },
              data: {
                status: WorkspaceMemberStatus.ACTIVE,
                updatedAt: new Date()
              }
            });
          }
          return callback(null, { userRef: user.ref, workspaceRef });
        }
      }
      throw error;
    }

    const inviteeToken = await createGenerateWorkspaceInviteToken(
      identityConfig
    )({
      userRef: user.ref,
      memberRef: newMember.ref,
      accessKeyId: user.accessKeyId,
      expiresIn: identityConfig.workspaceInviteExpiration
    });

    const deliverInvite = sendInvite(createSendEmail(identityConfig), {
      recipient: email,
      oneTimePassword,
      workspaceName: newMember.workspace.name,
      isExistingUser,
      inviteUrl: `${identityConfig.workspaceInviteUrl}?token=${inviteeToken}`
    });
    if (serviceLogin) {
      try {
        await deliverInvite;
      } catch (error) {
        logger.warn("brand voice login invite email was not sent", {
          email,
          error
        });
      }
    } else {
      await deliverInvite;
    }

    callback(null, {
      userRef: user?.ref,
      workspaceRef
    });
  };

  return withErrorHandlingAndValidation(
    inviteUserToWorkspace,
    V.inviteUserToWorkspaceRequestSchema
  );
}

export { createInviteUserToWorkspace };
