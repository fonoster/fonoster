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
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { createSendEmail } from "../utils";
import { createGenerateVerificationCode } from "../utils/createGenerateVerificationCode";
import { sendResetPasswordEmail } from "./sendResetPasswordEmail";
const logger = getLogger({ service: "identity", filePath: __filename });

function createSendResetPasswordCode(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const generateVerificationCode = createGenerateVerificationCode(prisma);

  const sendResetPasswordCode = async (
    call: { request: SendResetPasswordCodeRequest },
    callback: (error?: GrpcErrorMessage) => void
  ) => {
    const { request } = call;
    const { username } = request;

    logger.verbose("call to sendResetPasswordCode", { username });

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
      resetPasswordUrl: `${request.resetPasswordUrl}?token=${encodedPayload}`
    });

    callback(null);
  };

  return withErrorHandlingAndValidation(
    sendResetPasswordCode,
    V.sendResetPasswordCodeRequestSchema
  );
}

export { createSendResetPasswordCode };
