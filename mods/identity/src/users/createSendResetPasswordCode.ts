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
import { ContactType, SendResetPasswordCodeRequest } from "@fonoster/types";
import { status } from "@grpc/grpc-js";
import { VERIFICATION_CODE_SEND_LIMITS } from "../constants";
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { createSendEmail } from "../utils";
import { CallWithAddress, clientAddress } from "../utils/clientAddress";
import { createGenerateVerificationCode } from "../utils/createGenerateVerificationCode";
import { createSharedRateLimiter } from "../utils/rateLimiter";
import { sendResetPasswordEmail } from "./sendResetPasswordEmail";
const logger = getLogger({ service: "identity", filePath: __filename });

const tooManyRequests = {
  code: status.RESOURCE_EXHAUSTED,
  message: "Too many password reset requests; try again later"
};

/**
 * Emails a reset link. The link always points at Identity's configured reset
 * page (`resetPasswordUrl`); a URL in the request is ignored. Sends are rate
 * limited per email and per client IP, in this process's memory (each replica
 * counts on its own).
 */
function createSendResetPasswordCode(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const generateVerificationCode = createGenerateVerificationCode(prisma);
  const { perEmail, perIp, windowMs } = VERIFICATION_CODE_SEND_LIMITS;
  const withinEmailLimit = createSharedRateLimiter(prisma, {
    name: "reset-code:contact",
    limit: perEmail,
    windowMs
  });
  const withinIpLimit = createSharedRateLimiter(prisma, {
    name: "reset-code:ip",
    limit: perIp,
    windowMs
  });
  const resetPasswordUrl =
    identityConfig.resetPasswordUrl ??
    `${identityConfig.issuer.replace(/\/+$/, "")}/reset-password`;

  const sendResetPasswordCode = async (
    call: CallWithAddress & { request: SendResetPasswordCodeRequest },
    callback: (error?: GrpcErrorMessage) => void
  ) => {
    const { request } = call;
    const { username } = request;

    logger.verbose("call to sendResetPasswordCode", { username });

    // Counted before the lookup, so the answer is the same for unknown emails.
    if (
      !(await withinIpLimit(clientAddress(call))) ||
      !(await withinEmailLimit(username.toLowerCase()))
    ) {
      return callback(tooManyRequests);
    }

    const user = await prisma.user.findUnique({
      where: { email: username }
    });

    if (!user) {
      // The WebUI or any other client should display something like:
      // "If a user with this email exists, a password reset code has been sent"
      return callback(null);
    }

    const code = await generateVerificationCode({
      type: ContactType.EMAIL,
      value: username
    });

    const payload = { username, code };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );

    await sendResetPasswordEmail(createSendEmail(identityConfig), {
      recipient: username,
      resetPasswordUrl: `${resetPasswordUrl}?token=${encodeURIComponent(encodedPayload)}`
    });

    callback(null);
  };

  return withErrorHandlingAndValidation(
    sendResetPasswordCode,
    V.sendResetPasswordCodeRequestSchema
  );
}

export { createSendResetPasswordCode };
