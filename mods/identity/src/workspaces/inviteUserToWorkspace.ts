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
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { createSendEmail } from "./createSendEmail";
import { isAdminMember } from "./isAdminMember";
import { isWorkspaceMember } from "./isWorkspaceMember";
import { WorkspaceRoleEnum } from "./WorkspaceRoleEnum";
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { SendInvite } from "../invites/sendInvite";
import { AccessKeyIdType, generateAccessKeyId } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

const InviteUserToWorkspaceRequestSchema = z.object({
  workspaceId: z.string(),
  email: z.string().email(),
  name: z.string().min(3, "Name must contain at least 3 characters").max(50),
  role: z.enum([WorkspaceRoleEnum.ADMIN, WorkspaceRoleEnum.USER]),
  password: z
    .string()
    .min(6, "Password must contain at least 8 characters")
    .or(z.undefined())
});

type InviteUserToWorkspaceRequest = z.infer<
  typeof InviteUserToWorkspaceRequestSchema
>;

type CreateWorkspaceResponse = {
  workspaceId: string;
  userId: string;
};

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

enum WorkspaceMemberStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE"
}

function inviteUserToWorkspace(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  sendInvite: SendInvite
) {
  return async (
    call: { request: InviteUserToWorkspaceRequest },
    callback: (error: GRPCErrors, response?: CreateWorkspaceResponse) => void
  ) => {
    try {
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const inviterId = getUserIdFromToken(token);

      const { workspaceId, email, name, role } =
        InviteUserToWorkspaceRequestSchema.parse(call.request);

      logger.info("inviting user to workspace", { workspaceId, email });

      const isAdmin = await isAdminMember(prisma)(workspaceId, inviterId);

      if (!isAdmin) {
        return callback(inviterIsNotAdminError);
      }

      let user = await findUserByEmail(prisma, email);

      const isMember = await isWorkspaceMember(prisma)(workspaceId, user?.id);

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
          password: oneTimePassword
        });
      }

      const newMember = await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId,
          role: role as WorkspaceRoleEnum,
          status: WorkspaceMemberStatus.PENDING
        },
        include: {
          workspace: true
        }
      });

      await sendInvite(createSendEmail(identityConfig), {
        recipient: email,
        oneTimePassword,
        workspaceName: newMember.workspace.name,
        isExistingUser,
        // TODO: Create inviteUrl with invite token
        inviteUrl: "https://placehold.it?token=jwt"
      });

      callback(null, {
        userId: user?.id,
        workspaceId
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { inviteUserToWorkspace };
