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
import * as grpc from "@grpc/grpc-js";
import { z } from "zod";
import { Prisma } from "../db";
import { getAccessKeyIdFromToken } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";

const logger = getLogger({ service: "identity", filePath: __filename });

const UpdateUserRequestSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(50).or(z.string().optional().nullable()),
  password: z.string().min(8).max(50).or(z.string().optional().nullable()),
  avatar: z.string().url().or(z.string().optional().nullable())
});

type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

type UpdateUserResponse = {
  id: string;
};

function updateUser(prisma: Prisma) {
  return async (
    call: { request: UpdateUserRequest },
    callback: (error: GRPCErrors, response?: UpdateUserResponse) => void
  ) => {
    try {
      const validatedRequest = UpdateUserRequestSchema.parse(call.request);
      const token = getTokenFromCall(
        call as unknown as grpc.ServerInterceptingCall
      );
      const accessKeyId = getAccessKeyIdFromToken(token);
      const { id, name, avatar, password } = validatedRequest;

      logger.verbose("call to updateUser", { id, password });

      await prisma.user.update({
        where: {
          id,
          accessKeyId
        },
        data: {
          name,
          avatar,
          password: password || undefined,
          updatedAt: new Date()
        }
      });

      const response: UpdateUserResponse = {
        id
      };

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { updateUser };
