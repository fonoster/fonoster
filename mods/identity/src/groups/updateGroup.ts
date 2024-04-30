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
import { z } from "zod";
import { isGroupMember } from "./isGroupMember";
import { Prisma } from "../db";
import { GRPCErrors, handleError } from "../errors";
import { getTokenFromCall } from "../utils/getTokenFromCall";
import { getUserIdFromToken } from "../utils/getUserIdFromToken";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const UpdateGroupRequestSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(50).or(z.string().optional().nullable())
});

type UpdateGroupRequest = z.infer<typeof UpdateGroupRequestSchema>;

type UpdateGroupResponse = {
  id: string;
};

function updateGroup(prisma: Prisma) {
  return async (
    call: { request: UpdateGroupRequest },
    callback: (error: GRPCErrors, response?: UpdateGroupResponse) => void
  ) => {
    try {
      const validatedRequest = UpdateGroupRequestSchema.parse(call.request);
      const token = getTokenFromCall(
        call as unknown as grpc.ServerInterceptingCall
      );
      const userId = getUserIdFromToken(token);
      const { id, name } = validatedRequest;

      logger.verbose("call to updateGroup", { id, userId });

      const isMember = await isGroupMember(prisma)(id, userId);

      if (!isMember) {
        callback({
          code: grpc.status.PERMISSION_DENIED,
          message: "User is not a member of the group"
        });
      }

      await prisma.group.update({
        where: {
          id
        },
        data: {
          name
        }
      });

      const response: UpdateGroupResponse = {
        id
      };

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { updateGroup };
