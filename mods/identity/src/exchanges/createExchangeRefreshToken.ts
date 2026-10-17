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
  TokenUseEnum,
  verifyToken,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import {
  createGetApiKeyByAccessKeyId,
  isApiKeyExpired
} from "../utils/createGetApiKeyByAccessKeyId";
import { exchangeTokens } from "./exchangeTokens";
import { createRefreshTokenStore } from "./refreshTokens";
import {
  ExchangeRefreshTokenRequest,
  ExchangeResponse,
  IdentityConfig
} from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

const invalidRefreshToken = {
  code: status.UNAUTHENTICATED,
  message: "Invalid refresh token"
};

/**
 * The claims of a refresh token this Identity issued (RS256, its issuer and
 * audience, `tokenUse: "refresh"`, with a `jti`), or undefined.
 */
function verifyRefreshToken(token: string, identityConfig: IdentityConfig) {
  const claims = verifyToken(token, identityConfig.publicKey, {
    issuer: identityConfig.issuer,
    audience: identityConfig.audience
  });

  if (
    !claims ||
    claims.tokenUse !== TokenUseEnum.REFRESH ||
    typeof claims.jti !== "string" ||
    typeof claims.accessKeyId !== "string"
  ) {
    return undefined;
  }

  return claims as { jti: string; accessKeyId: string };
}

function createExchangeRefreshToken(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  const refreshTokens = createRefreshTokenStore(prisma);
  const getApiKey = createGetApiKeyByAccessKeyId(prisma);

  /** The user or API key still exists (and the key hasn't expired). */
  const principalIsActive = async (accessKeyId: string) => {
    if (accessKeyId.startsWith("US")) {
      return (await prisma.user.findFirst({ where: { accessKeyId } })) !== null;
    }
    const key = await getApiKey(accessKeyId);
    return key !== null && !isApiKeyExpired(key);
  };

  const exchangeRefreshToken = async (
    call: { request: ExchangeRefreshTokenRequest },
    callback: (error?: GrpcErrorMessage, response?: ExchangeResponse) => void
  ) => {
    const claims = verifyRefreshToken(
      call.request.refreshToken,
      identityConfig
    );

    if (!claims) {
      return callback(invalidRefreshToken);
    }

    const { jti, accessKeyId } = claims;

    logger.verbose("call to exchangeRefreshToken", { accessKeyId });

    // Single use: a token seen before (or revoked) revokes its whole family.
    const consumed = await refreshTokens.consume(jti);

    if (consumed.status !== "ok" || consumed.accessKeyId !== accessKeyId) {
      if (consumed.status === "reused") {
        logger.warn("refresh token reused; its family is revoked", {
          accessKeyId
        });
      }
      return callback(invalidRefreshToken);
    }

    if (!(await principalIsActive(accessKeyId))) {
      await refreshTokens.revokeFamily(consumed.familyId);
      return callback(invalidRefreshToken);
    }

    callback(
      null,
      await exchangeTokens(prisma, identityConfig)(accessKeyId, {
        familyId: consumed.familyId
      })
    );
  };

  return withErrorHandlingAndValidation(
    exchangeRefreshToken,
    exchangeRefreshTokenRequestSchema
  );
}

export { createExchangeRefreshToken, verifyRefreshToken };
