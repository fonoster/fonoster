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
  exchangeRefreshTokenRequestSchema,
  GrpcErrorMessage,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import jwt from "jsonwebtoken";
import { SIGN_ALGORITHM } from "../constants";
import { Prisma } from "../db";
import { exchangeTokens } from "./exchangeTokens";
import {
  ExchangeRefreshTokenRequest,
  ExchangeResponse,
  IdentityConfig
} from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

function createExchangeRefreshToken(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const exchangeRefreshToken = async (
    call: { request: ExchangeRefreshTokenRequest },
    callback: (error?: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const { privateKey } = identityConfig;
    const { request } = call;
    const { refreshToken: oldRefreshToken } = request;

    const oldRefreshTokenDecoded = jwt.verify(oldRefreshToken, privateKey, {
      algorithms: [SIGN_ALGORITHM]
    }) as { accessKeyId: string };

    const { accessKeyId } = oldRefreshTokenDecoded;

    logger.verbose("call to exchangeRefreshToken", { accessKeyId });

    callback(null, await exchangeTokens(prisma, identityConfig)(accessKeyId));
  };

  return withErrorHandlingAndValidation(
    exchangeRefreshToken,
    exchangeRefreshTokenRequestSchema
  );
}

export { createExchangeRefreshToken };
