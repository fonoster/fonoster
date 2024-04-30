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
import { status } from "@grpc/grpc-js";
import * as grpc from "@grpc/grpc-js";
import { isAdminMember } from "./isAdminMember";
import { Prisma } from "../db";
import { GRPCErrors, handleError } from "../errors";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "apiserver", filePath: __filename });

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
      const token = getTokenFromCall(
        call as unknown as grpc.ServerInterceptingCall
      );
      const userIdFromToken = getUserIdFromToken(token);

      logger.debug("removing user from group", { groupId, userId });

      const isAdmin = await isAdminMember(prisma)(groupId, userIdFromToken);

      if (!isAdmin && userIdFromToken !== userId) {
        return callback({
          code: status.PERMISSION_DENIED,
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
          code: status.NOT_FOUND,
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
