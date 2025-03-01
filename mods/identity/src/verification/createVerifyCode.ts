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
import { ContactType } from "@fonoster/types";
import { status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { createIsValidVerificationCode } from "../utils/createIsValidVerificationCode";
import { VerifyCodeRequest } from "./types";

function createVerifyCode(prisma: Prisma) {
  const isValidVerificationCode = createIsValidVerificationCode(prisma);

  const verifyCode = async (
    call: { request: VerifyCodeRequest },
    callback: (error: GrpcErrorMessage) => void
  ) => {
    const { request } = call;
    const { username, contactType, value, verificationCode } = request;
    const actualContactType = contactType ?? ContactType.EMAIL;

    const isValid = await isValidVerificationCode({
      type: actualContactType,
      value,
      code: verificationCode
    });

    if (!isValid) {
      return callback({
        code: status.PERMISSION_DENIED,
        message: "Invalid verification code"
      });
    } else if (actualContactType === ContactType.EMAIL && isValid) {
      await prisma.user.update({
        where: { email: username },
        data: { emailVerified: true }
      });
    } else if (actualContactType === ContactType.PHONE && isValid) {
      await prisma.user.update({
        where: { email: username, phoneNumber: value },
        data: { phoneNumberVerified: true }
      });
    }

    callback(null);
  };

  return withErrorHandlingAndValidation(verifyCode, V.verifyCodeRequestSchema);
}

export { createVerifyCode };
