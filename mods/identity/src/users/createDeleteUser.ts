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
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { BillingHooks } from "../exchanges/types";
import { getAccessKeyIdFromToken } from "../utils";

const logger = getLogger({ service: "identity", filePath: __filename });

function createDeleteUser(prisma: Prisma, billing?: BillingHooks) {
  const deleteUser = async (
    call: { request: BaseApiObject },
    callback: (error?: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { ref } = request;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const accessKeyId = getAccessKeyIdFromToken(token);

    logger.verbose("deleting user from the system", { ref, accessKeyId });

    const user = await prisma.user.findUnique({ where: { ref, accessKeyId } });
    if (!user) {
      callback({
        code: status.NOT_FOUND,
        message: "The requested resource was not found"
      });
      return;
    }

    // Fonoster Cloud: the plan stops before the user goes, and a user who owes can't leave. Fails
    // closed: when billing can't be asked, the user stays.
    if (billing) {
      try {
        await billing.closeAccount(ref);
      } catch (e) {
        const { code, message } = e as { code?: number; message?: string };
        if (code === status.FAILED_PRECONDITION) {
          callback({ code, message });
        } else {
          logger.warn("could not close the user's billing account", {
            ref,
            code,
            message
          });
          callback({
            code: status.UNAVAILABLE,
            message: "couldn't check the user's billing; try again"
          });
        }
        return;
      }
    }

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
