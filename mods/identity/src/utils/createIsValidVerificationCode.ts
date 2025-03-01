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
import { VERIFICATION_CODE_EXPIRATION } from "../constants";
import { Prisma } from "../db";
import { VerificationType } from "../generated/@prisma/client";

function createIsValidVerificationCode(prisma: Prisma) {
  return async (params: {
    type: VerificationType;
    value: string;
    code: string;
  }) => {
    const { type, value, code } = params;

    // Delete old verification codes
    await prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - VERIFICATION_CODE_EXPIRATION)
        }
      }
    });

    const result = await prisma.verificationCode.findFirst({
      where: {
        type,
        value,
        code
      }
    });

    return !!result;
  };
}

export { createIsValidVerificationCode };
