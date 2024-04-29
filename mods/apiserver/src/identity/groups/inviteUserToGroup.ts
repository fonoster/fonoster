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
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { isAdminMember } from "./isAdminMember";
import { isGroupMember } from "./isGroupMember";
import { sendEmail } from "./sendEmail";
import { Prisma } from "../../db";
import { SMTP_SENDER } from "../../envs";
import { GRPCErrors, handleError } from "../../errors";
import { SendInvite } from "../invites/sendInvite";
import RoleEnum from "../RoleEnum";
import { AccessKeyIdType, generateAccessKeyId } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const InviteUserToGroupRequestSchema = z.object({
  groupId: z.string(),
  email: z.string().email(),
  name: z.string().min(3, "Name must contain at least 3 characters").max(50),
  role: z.enum([RoleEnum.ADMIN, RoleEnum.USER]),
  password: z
    .string()
    .min(6, "Password must contain at least 8 characters")
    .or(z.undefined())
});

type InviteUserToGroupRequest = z.infer<typeof InviteUserToGroupRequestSchema>;

type CreateGroupResponse = {
  groupId: string;
  userId: string;
};

const userIsMemberError = {
  code: grpc.status.ALREADY_EXISTS,
  message: "User is already a member of this group"
};

const inviterIsNotAdminError = {
  code: grpc.status.PERMISSION_DENIED,
  message: "Only admins or owners can invite users to a group"
};

const findUserByEmail = async (prisma: Prisma, email: string) => {
  return await prisma.user.findUnique({
    where: {
      email
    }
  });
};

const createUser = (prisma: Prisma) => {
  return async (request: InviteUserToGroupRequest) => {
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

enum GroupMemberStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE"
}

function inviteUserToGroup(prisma: Prisma, sendInvite: SendInvite) {
  return async (
    call: { request: InviteUserToGroupRequest },
    callback: (error: GRPCErrors, response?: CreateGroupResponse) => void
  ) => {
    try {
      const token = getTokenFromCall(
        call as unknown as grpc.ServerInterceptingCall
      );
      const inviterId = getUserIdFromToken(token);

      const { groupId, email, name, role } =
        InviteUserToGroupRequestSchema.parse(call.request);

      logger.info("inviting user to group", { groupId, email });

      const isAdmin = await isAdminMember(prisma)(groupId, inviterId);

      if (!isAdmin) {
        return callback(inviterIsNotAdminError);
      }

      let user = await findUserByEmail(prisma, email);

      const isMember = await isGroupMember(prisma)(groupId, user?.id);

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

      const newMember = await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId,
          role: role as RoleEnum,
          status: GroupMemberStatus.PENDING
        },
        include: {
          group: true
        }
      });

      await sendInvite(sendEmail, {
        sender: SMTP_SENDER,
        recipient: email,
        oneTimePassword,
        groupName: newMember.group.name,
        isExistingUser,
        // TODO: Create inviteUrl with invite token
        inviteUrl: "https://placehold.it?token=jwt"
      });

      callback(null, {
        userId: user?.id,
        groupId
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { inviteUserToGroup };
