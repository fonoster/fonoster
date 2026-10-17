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
  createSendSmsTwilioImpl,
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { status } from "@grpc/grpc-js";
import { VERIFICATION_CODE_SEND_LIMITS } from "../constants";
import { Prisma } from "../db";
import { IdentityConfig } from "../exchanges";
import { CallWithAddress, clientAddress } from "../utils/clientAddress";
import { createGenerateVerificationCode } from "../utils/createGenerateVerificationCode";
import { createSendEmail } from "../utils/createSendEmail";
import { createRateLimiter } from "../utils/rateLimiter";
import { sendVerificationEmail } from "./sendVerificationEmail";
import { sendVerificationMessage } from "./sendVerificationMessage";
import { ContactType, SendVerificationCodeRequest } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

type CallWithPeer = CallWithAddress & {
  request: SendVerificationCodeRequest;
};

const tooManyRequests = {
  code: status.RESOURCE_EXHAUSTED,
  message: "Too many verification codes requested; try again later"
};

function createSendVerificationCode(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const sendSms = createSendSmsTwilioImpl(identityConfig.twilioSmsConfig);
  const sendEmail = createSendEmail(identityConfig);
  const generateVerificationCode = createGenerateVerificationCode(prisma);
  const { perEmail, perIp, windowMs } = VERIFICATION_CODE_SEND_LIMITS;
  const withinContactLimit = createRateLimiter({ limit: perEmail, windowMs });
  const withinIpLimit = createRateLimiter({ limit: perIp, windowMs });

  // The response never says whether the contact belongs to an account.
  const fn = async (
    call: CallWithPeer,
    callback: (error: GrpcErrorMessage) => void
  ) => {
    const { request } = call;
    const actualContactType = request.contactType ?? ContactType.EMAIL;
    const contact = `${actualContactType}:${request.value.toLowerCase()}`;

    if (!withinIpLimit(clientAddress(call)) || !withinContactLimit(contact)) {
      return callback(tooManyRequests);
    }

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
