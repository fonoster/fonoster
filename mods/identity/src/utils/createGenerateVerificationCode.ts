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

function createGenerateVerificationCode(prisma: Prisma) {
  return async (params: { type: VerificationType; value: string }) => {
    const { type, value } = params;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

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
