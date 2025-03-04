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
  datesMapper,
  getTokenFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, User } from "@fonoster/types";
import { status as GRPCStatus, ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getAccessKeyIdFromToken } from "../utils";

const logger = getLogger({ service: "identity", filePath: __filename });

function createGetUser(prisma: Prisma) {
  const getUser = async (
    call: { request: BaseApiObject },
    callback: (error: GrpcErrorMessage, response?: User) => void
  ) => {
    const { request } = call;
    const { ref } = request;

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
  };

  return withErrorHandlingAndValidation(getUser, V.emptySchema);
}

export { createGetUser };
