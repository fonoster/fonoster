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
import { GRPCErrors, datesMapper, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getAccessKeyIdFromToken } from "../utils";
import { getTokenFromCall } from "../utils/getTokenFromCall";

const logger = getLogger({ service: "identity", filePath: __filename });

type GetUserRequest = {
  ref: string;
};

type User = {
  ref: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
};

function getUser(prisma: Prisma) {
  return async (
    call: { request: GetUserRequest },
    callback: (error: GRPCErrors, response?: User) => void
  ) => {
    try {
      const { ref } = call.request;
      const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
      const accessKeyId = getAccessKeyIdFromToken(token);

      logger.verbose("getting user with ref and accessKeyId", {
        ref,
        accessKeyId
      });

      const user = await prisma.user.findUnique({
        where: {
          ref,
          accessKeyId
        }
      });

      if (!user) {
        callback({
          code: GRPCStatus.NOT_FOUND,
          message: `User not found: ${ref}`
        });
        return;
      }

      callback(null, datesMapper(user));
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { getUser };
