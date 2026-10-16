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
import { randomInt } from "crypto";
import { VERIFICATION_CODE_EXPIRATION } from "../constants";
import { Prisma } from "../db";
import { VerificationType } from "../generated/@prisma/client";
import { normalizeContact } from "./normalizeContact";

/**
 * Issues a 6-digit code for a contact. Earlier unused codes for the same
 * contact stop working, so only the latest email or SMS is valid.
 */
function createGenerateVerificationCode(prisma: Prisma) {
  return async (params: { type: VerificationType; value: string }) => {
    const { type } = params;
    const value = normalizeContact(type, params.value);
    const code = randomInt(100000, 1000000).toString();

    await prisma.verificationCode.deleteMany({
      where: { type, value, consumedAt: null }
    });

    await prisma.verificationCode.create({
      data: {
        type,
        value,
        code,
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRATION)
      }
    });

    return code;
  };
}

export { createGenerateVerificationCode };
