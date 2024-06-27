/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { GRPCErrorMessage, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { exchangeTokens } from "./exchangeTokens";
import { IdentityConfig } from "./types";
import { Prisma } from "../db";

const logger = getLogger({ service: "identity", filePath: __filename });

const ExchangeRefreshTokenRequestSchema = z.object({
  refreshToken: z.string()
});

type ExchangeRefreshTokenRequest = z.infer<
  typeof ExchangeRefreshTokenRequestSchema
>;

type ExchangeCredentialsResponse = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

const SIGN_ALGORITHM = "RS256";

function exchangeRefreshToken(prisma: Prisma, identityConfig: IdentityConfig) {
  return async (
    call: { request: ExchangeRefreshTokenRequest },
    callback: (error: GRPCErrorMessage, response?: ExchangeCredentialsResponse) => void
  ) => {
    try {
      const validatedRequest = ExchangeRefreshTokenRequestSchema.parse(
        call.request
      );
      const { refreshToken: oldRefreshToken } = validatedRequest;
      const { privateKey } = identityConfig;

      const oldRefreshTokenDecoded = jwt.verify(oldRefreshToken, privateKey, {
        algorithms: [SIGN_ALGORITHM]
      }) as { accessKeyId: string };
      const { accessKeyId } = oldRefreshTokenDecoded;

      logger.verbose("call to exchangeRefreshToken", { accessKeyId });

      return callback(
        null,
        await exchangeTokens(prisma, identityConfig)(accessKeyId)
      );
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { exchangeRefreshToken };
