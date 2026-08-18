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
  createSendEmail,
  createSendSmsTwilioImpl,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges";
import { createGenerateVerificationCode } from "../utils/createGenerateVerificationCode";
import { sendVerificationEmail } from "./sendVerificationEmail";
import { sendVerificationMessage } from "./sendVerificationMessage";
import { ContactType, SendVerificationCodeRequest } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

function createSendVerificationCode(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const sendSms = createSendSmsTwilioImpl(identityConfig.twilioSmsConfig);
  const sendEmail = createSendEmail(identityConfig.smtpConfig);
  const generateVerificationCode = createGenerateVerificationCode(prisma);

  const fn = async (
    call: { request: SendVerificationCodeRequest },
    callback: (error: GrpcErrorMessage) => void
  ) => {
    const { request } = call;
    const actualContactType = request.contactType ?? ContactType.EMAIL;

    const verificationCode = await generateVerificationCode({
      type: actualContactType,
      value: request.value
    });

    if (actualContactType === ContactType.EMAIL) {
      sendVerificationEmail(sendEmail, {
        recipient: request.value,
        verificationCode
      }).catch((error) => {
        logger.error("failed to send verification email", {
          recipient: request.value,
          error: error instanceof Error ? error.message : error
        });
      });
    } else {
      await sendVerificationMessage(sendSms, {
        recipient: request.value,
        verificationCode
      });
    }

    callback(null);
  };

  return withErrorHandlingAndValidation(
    fn,
    V.sendVerificationCodeRequestSchema
  );
}

export { createSendVerificationCode };
