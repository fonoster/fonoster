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
import { status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import {
  isMethodEnabled,
  isOpenSignup,
  methodDisabledError
} from "../utils/authMethods";
import { createClaimUnverifiedAccount } from "../utils/claimUnverifiedAccount";
import { CallWithAddress, clientAddress } from "../utils/clientAddress";
import { createGetUserByEmail } from "../utils/createGetUserByEmail";
import { createIsValidVerificationCode } from "../utils/createIsValidVerificationCode";
import {
  AccessKeyIdType,
  generateAccessKeyId
} from "../utils/generateAccessKeyId";
import {
  createSignInThrottle,
  SignInThrottle,
  tooManySignInAttempts
} from "../utils/signInThrottle";
import { ContactType } from "../verification/types";
import { exchangeTokens } from "./exchangeTokens";
import { ExchangeResponse, IdentityConfig } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

const invalidCode = {
  code: status.PERMISSION_DENIED,
  message: "Invalid verification code"
};

type ExchangeVerificationCodeRequest = { email: string; code: string };

/**
 * Passwordless sign-in: trades the code from SendVerificationCode for tokens.
 * The first sign-in creates the account when sign-up is open; with invite-only
 * sign-up, unknown emails get the same error as a wrong code.
 */
function createExchangeVerificationCode(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  throttle: SignInThrottle = createSignInThrottle()
) {
  const isValidVerificationCode = createIsValidVerificationCode(prisma);
  const getUserByEmail = createGetUserByEmail(prisma);
  const claimUnverifiedAccount = createClaimUnverifiedAccount(prisma);

  const exchangeVerificationCode = async (
    call: CallWithAddress & { request: ExchangeVerificationCodeRequest },
    callback: (error?: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const email = call.request.email.trim().toLowerCase();

    logger.verbose("call to exchangeVerificationCode", { email });

    if (!isMethodEnabled(identityConfig, "email_code")) {
      return callback(methodDisabledError("email_code"));
    }

    const ip = clientAddress(call);

    if (throttle.isBlocked(email, ip)) {
      return callback(tooManySignInAttempts);
    }

    const isValid = await isValidVerificationCode({
      type: ContactType.EMAIL,
      value: email,
      code: call.request.code
    });

    if (!isValid) {
      throttle.recordFailure(email, ip);
      return callback(invalidCode);
    }

    const existing = await getUserByEmail(email);

    if (!existing && !isOpenSignup(identityConfig)) {
      return callback(invalidCode);
    }

    // The code proves the address, so the email is verified either way. An
    // account whose email was never verified loses its password (M2).
    const user = existing
      ? await claimUnverifiedAccount(existing)
      : await prisma.user.create({
          data: {
            name: email.split("@")[0].slice(0, 60),
            email,
            emailVerified: true,
            accessKeyId: generateAccessKeyId(AccessKeyIdType.USER)
          }
        });

    callback(
      null,
      await exchangeTokens(prisma, identityConfig)(user.accessKeyId)
    );
  };

  return withErrorHandlingAndValidation(
    exchangeVerificationCode,
    V.exchangeVerificationCodeRequestSchema
  );
}

export { createExchangeVerificationCode, ExchangeVerificationCodeRequest };
