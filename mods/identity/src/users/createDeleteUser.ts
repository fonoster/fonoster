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
  getTokenFromCall,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { getAccessKeyIdFromToken } from "../utils";

const logger = getLogger({ service: "identity", filePath: __filename });

function createDeleteUser(prisma: Prisma) {
  const deleteUser = async (
    call: { request: BaseApiObject },
    callback: (error?: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { ref } = request;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const accessKeyId = getAccessKeyIdFromToken(token);

    logger.verbose("deleting user from the system", { ref, accessKeyId });

    await prisma.user.delete({
      where: {
        ref,
        accessKeyId
      }
    });

    callback(null, { ref });
  };

  return withErrorHandlingAndValidation(deleteUser, V.emptySchema);
}

export { createDeleteUser };
