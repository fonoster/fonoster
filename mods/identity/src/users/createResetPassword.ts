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
import { Prisma } from "../db";
import { createIsValidVerificationCode } from "../utils/createIsValidVerificationCode";

const logger = getLogger({ service: "identity", filePath: __filename });

function createResetPassword(prisma: Prisma) {
  const isValidVerificationCode = createIsValidVerificationCode(prisma);

  const resetPassword = async (
    call: { request: ResetPasswordRequest },
    callback: (error?: GrpcErrorMessage) => void
  ) => {
    const { request } = call;
    const { username, password, verificationCode } = request;

    logger.verbose("call to resetPassword", {
      username,
      password,
      verificationCode
    });

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

    await prisma.user.update({
      where: { email: username },
      data: { password }
    });

    callback(null);
  };

  return withErrorHandlingAndValidation(
    resetPassword,
    V.resetPasswordRequestSchema
  );
}

export { createResetPassword };
