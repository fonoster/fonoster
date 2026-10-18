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
  exchangeCredentialsRequestSchema,
  GrpcErrorMessage,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { Prisma } from "../db";
import { isMethodEnabled, methodDisabledError } from "../utils/authMethods";
import { CallWithAddress, clientAddress } from "../utils/clientAddress";
import { createGetUserByEmail } from "../utils/createGetUserByEmail";
import { createIsValidVerificationCode } from "../utils/createIsValidVerificationCode";
import {
  createSignInThrottle,
  SignInThrottle,
  tooManySignInAttempts
} from "../utils/signInThrottle";
import { createVerifyUserPassword } from "../utils/userPasswords";
import { ContactType } from "../verification";
import { exchangeTokens } from "./exchangeTokens";
import {
  ExchangeCredentialsRequest,
  ExchangeResponse,
  IdentityConfig
} from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

/**
 * Password sign-in. Failed attempts are throttled per email and per client IP
 * (see createSignInThrottle).
 */
function createExchangeCredentials(
  prisma: Prisma,
  identityConfig: IdentityConfig,
  throttle: SignInThrottle = createSignInThrottle()
) {
  const isValidVerificationCode = createIsValidVerificationCode(prisma);
  const verifyUserPassword = createVerifyUserPassword(prisma);

  const exchangeCredentials = async (
    call: CallWithAddress & { request: ExchangeCredentialsRequest },
    callback: (error?: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const { request } = call;
    const { username: email, password, twoFactorCode } = request;

    logger.verbose("call to exchangeCredentials", { username: email });

    if (!isMethodEnabled(identityConfig, "password")) {
      return callback(methodDisabledError("password"));
    }

    const ip = clientAddress(call);

    if (throttle.isBlocked(email, ip)) {
      return callback(tooManySignInAttempts);
    }

    const user = await createGetUserByEmail(prisma)(email);

    if (!user || !(await verifyUserPassword(user, password?.trim()))) {
      throttle.recordFailure(email, ip);
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "Invalid credentials"
      });
    }

    // TODO: Rename verifcation methods to be more generic
    // At the moment name would suggest that 2FA and verification are the same thing
    if (identityConfig.twoFactorAuthenticationRequired) {
      const isValid = await isValidVerificationCode({
        type: ContactType.EMAIL,
        value: email,
        code: twoFactorCode
      });

      if (!isValid) {
        throttle.recordFailure(email, ip);
        return callback({
          code: grpc.status.PERMISSION_DENIED,
          message: "Invalid 2FA code"
        });
      }
    }

    callback(
      null,
      await exchangeTokens(prisma, identityConfig)(user.accessKeyId)
    );
  };

  return withErrorHandlingAndValidation(
    exchangeCredentials,
    exchangeCredentialsRequestSchema
  );
}

export { createExchangeCredentials };
