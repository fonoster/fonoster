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
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ContactType, ResetPasswordRequest } from "@fonoster/types";
import { status } from "@grpc/grpc-js";
import { RESET_PASSWORD_ATTEMPT_LIMITS } from "../constants";
import { Prisma } from "../db";
import { createRefreshTokenStore } from "../exchanges/refreshTokens";
import { CallWithAddress, clientAddress } from "../utils/clientAddress";
import { createIsValidVerificationCode } from "../utils/createIsValidVerificationCode";
import { createRateLimiter } from "../utils/rateLimiter";
import { passwordColumns } from "../utils/userPasswords";

const logger = getLogger({ service: "identity", filePath: __filename });

/**
 * Sets a new password with an emailed code and signs the user out everywhere
 * (their refresh tokens are revoked). Attempts are rate limited per email and
 * per client IP, in this process's memory.
 */
function createResetPassword(prisma: Prisma) {
  const isValidVerificationCode = createIsValidVerificationCode(prisma);
  const refreshTokens = createRefreshTokenStore(prisma);
  const { perEmail, perIp, windowMs } = RESET_PASSWORD_ATTEMPT_LIMITS;
  const withinEmailLimit = createRateLimiter({ limit: perEmail, windowMs });
  const withinIpLimit = createRateLimiter({ limit: perIp, windowMs });

  const resetPassword = async (
    call: CallWithAddress & { request: ResetPasswordRequest },
    callback: (error?: GrpcErrorMessage) => void
  ) => {
    const { request } = call;
    const { username, password, verificationCode } = request;

    logger.verbose("call to resetPassword", { username });

    if (
      !withinIpLimit(clientAddress(call)) ||
      !withinEmailLimit(username.toLowerCase())
    ) {
      return callback({
        code: status.RESOURCE_EXHAUSTED,
        message: "Too many password reset attempts; try again later"
      });
    }

    const isValid = await isValidVerificationCode({
      type: ContactType.EMAIL,
      value: username,
      code: verificationCode
    });

    if (!isValid) {
      return callback({
        code: status.PERMISSION_DENIED,
        message: "Invalid verification code"
      });
    }

    const user = await prisma.user.update({
      where: { email: username },
      data: { ...(await passwordColumns(password)), mustChangePassword: false }
    });

    await refreshTokens.revokeAll(user.accessKeyId);

    callback(null);
  };

  return withErrorHandlingAndValidation(
    resetPassword,
    V.resetPasswordRequestSchema
  );
}

export { createResetPassword };
