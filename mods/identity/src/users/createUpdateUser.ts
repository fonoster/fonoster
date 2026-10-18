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
import { BaseApiObject, UpdateUserRequest } from "@fonoster/types";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { createRefreshTokenStore } from "../exchanges/refreshTokens";
import { getAccessKeyIdFromToken } from "../utils";
import {
  createVerifyUserPassword,
  passwordColumns
} from "../utils/userPasswords";
import { UserUpdateInput } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

/**
 * Updates the caller's own profile. A new password needs the current one
 * (an access token alone can't change it) and signs the user out everywhere:
 * every refresh token is revoked. Accounts without a password (GitHub or
 * email-code sign-in) set one with the password-reset flow, which proves the
 * email.
 */
function createUpdateUser(prisma: Prisma) {
  const verifyUserPassword = createVerifyUserPassword(prisma);
  const refreshTokens = createRefreshTokenStore(prisma);

  const updateUser = async (
    call: { request: UpdateUserRequest },
    callback: (error: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { ref, name, avatar, password, currentPassword, phone } = request;

    const token = getTokenFromCall(call as unknown as ServerInterceptingCall);
    const accessKeyId = getAccessKeyIdFromToken(token);

    logger.verbose("call to updateUser", { ref });

    if (password) {
      const user = await prisma.user.findFirst({
        where: { ref, accessKeyId }
      });

      if (!user) {
        return callback({ code: status.NOT_FOUND, message: "User not found" });
      }

      if (!user.passwordDigest && !user.password) {
        return callback({
          code: status.FAILED_PRECONDITION,
          message:
            "This account has no password; set one with the password reset flow"
        });
      }

      if (!(await verifyUserPassword(user, currentPassword?.trim() ?? ""))) {
        return callback({
          code: status.PERMISSION_DENIED,
          message: "The current password is incorrect"
        });
      }
    }

    const updateData = {
      name,
      avatar,
      // A new password replaces any one-time password from an invite.
      ...(password
        ? { ...(await passwordColumns(password)), mustChangePassword: false }
        : {}),
      updatedAt: new Date()
    } as UserUpdateInput;

    if (phone && phone !== "") {
      updateData.phoneNumber = phone;
      updateData.phoneNumberVerified = false;
    }

    await prisma.user.update({
      where: {
        ref,
        accessKeyId
      },
      data: updateData
    });

    if (password) {
      await refreshTokens.revokeAll(accessKeyId);
    }

    const response: BaseApiObject = {
      ref
    };

    callback(null, response);
  };

  return withErrorHandlingAndValidation(updateUser, V.updateUserRequestSchema);
}

export { createUpdateUser };
