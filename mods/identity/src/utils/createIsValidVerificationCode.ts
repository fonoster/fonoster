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
  VERIFICATION_CODE_EXPIRATION,
  VERIFICATION_CODE_MAX_ATTEMPTS
} from "../constants";
import { Prisma } from "../db";
import { VerificationType } from "../generated/@prisma/client";
import { normalizeContact } from "./normalizeContact";
import { equalsInConstantTime } from "./passwords";

/**
 * Checks a code and, when it matches, consumes it: a code works once, only
 * before it expires, and only until VERIFICATION_CODE_MAX_ATTEMPTS wrong
 * guesses have been made against it.
 */
function createIsValidVerificationCode(prisma: Prisma) {
  return async (params: {
    type: VerificationType;
    value: string;
    code: string;
  }) => {
    const { type, code } = params;
    const value = normalizeContact(type, params.value);
    const now = new Date();

    // Housekeeping: drop codes that expired a while ago.
    await prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(now.getTime() - VERIFICATION_CODE_EXPIRATION)
        }
      }
    });

    const current = await prisma.verificationCode.findFirst({
      where: {
        type,
        value,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: VERIFICATION_CODE_MAX_ATTEMPTS }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!current) {
      return false;
    }

    if (!code || !equalsInConstantTime(current.code, code)) {
      await prisma.verificationCode.update({
        where: { ref: current.ref },
        data: { attempts: { increment: 1 } }
      });
      return false;
    }

    // Conditional update so two concurrent requests can't both use the code.
    const { count } = await prisma.verificationCode.updateMany({
      where: { ref: current.ref, consumedAt: null },
      data: { consumedAt: now }
    });

    return count === 1;
  };
}

export { createIsValidVerificationCode };
