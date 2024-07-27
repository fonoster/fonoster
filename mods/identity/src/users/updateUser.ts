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
import { GrpcErrorMessage, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, UpdateUserRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { z } from "zod";
import { Prisma } from "../db";
import { getAccessKeyIdFromToken } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";

const logger = getLogger({ service: "identity", filePath: __filename });

const UpdateUserRequestSchema = z.object({
  ref: z.string(),
  name: z.string().min(3).max(50).or(z.string().optional().nullable()),
  password: z.string().min(8).max(50).or(z.string().optional().nullable()),
  avatar: z.string().url().or(z.string().optional().nullable())
});

function updateUser(prisma: Prisma) {
  return async (
    call: { request: UpdateUserRequest },
    callback: (error: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    try {
      const validatedRequest = UpdateUserRequestSchema.parse(call.request);
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const accessKeyId = getAccessKeyIdFromToken(token);
      const { ref, name, avatar, password } = validatedRequest;

      logger.verbose("call to updateUser", { ref, password });

      await prisma.user.update({
        where: {
          ref,
          accessKeyId
        },
        data: {
          name,
          avatar,
          password: password || undefined,
          updatedAt: new Date()
        }
      });

      const response: BaseApiObject = {
        ref
      };

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { updateUser };
