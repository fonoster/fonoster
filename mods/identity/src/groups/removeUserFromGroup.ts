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
import { isAdminMember } from "./isAdminMember";
import { Prisma } from "../db";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "identity", filePath: __filename });

type RemoveUserFromGroupRequest = {
  groupId: string;
  userId: string;
};

type RemoveUserFromGroupResponse = {
  groupId: string;
  userId: string;
};

function removeUserFromGroup(prisma: Prisma) {
  return async (
    call: { request: RemoveUserFromGroupRequest },
    callback: (
      error: GRPCErrors,
      response?: RemoveUserFromGroupResponse
    ) => void
  ) => {
    try {
      const { groupId, userId } = call.request;
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const userIdFromToken = getUserIdFromToken(token);

      logger.debug("removing user from group", { groupId, userId });

      const isAdmin = await isAdminMember(prisma)(groupId, userIdFromToken);

      if (!isAdmin && userIdFromToken !== userId) {
        return callback({
          code: GRPCStatus.PERMISSION_DENIED,
          message: "Only admins or owners can remove users from a group"
        });
      }

      const memberId = await prisma.groupMember.findFirst({
        where: {
          groupId,
          userId
        }
      });

      if (!memberId) {
        return callback({
          code: GRPCStatus.NOT_FOUND,
          message: "User not found in group"
        });
      }

      const response = await prisma.groupMember.delete({
        where: {
          id: memberId?.id
        }
      });

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { removeUserFromGroup };
