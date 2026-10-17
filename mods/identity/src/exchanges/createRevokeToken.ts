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
import { status } from "@grpc/grpc-js";
import { Prisma } from "../db";
import { verifyRefreshToken } from "./createExchangeRefreshToken";
import { createRefreshTokenStore } from "./refreshTokens";
import { IdentityConfig } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

type RevokeTokenRequest = { token: string };

/**
 * Sign-out: revokes the refresh token and every token rotated from the same
 * sign-in. Holding the refresh token is the authorization, so the method is
 * public. Access tokens already issued stay valid until they expire.
 */
function createRevokeToken(prisma: Prisma, identityConfig: IdentityConfig) {
  const refreshTokens = createRefreshTokenStore(prisma);

  const revokeToken = async (
    call: { request: RevokeTokenRequest },
    callback: (error?: GrpcErrorMessage, response?: { token: string }) => void
  ) => {
    const claims = verifyRefreshToken(call.request.token, identityConfig);

    if (!claims) {
      return callback({
        code: status.UNAUTHENTICATED,
        message: "Invalid refresh token"
      });
    }

    const row = await prisma.refreshToken.findUnique({
      where: { jti: claims.jti }
    });

    if (row) {
      await refreshTokens.revokeFamily(row.familyId);
    }

    logger.verbose("refresh token revoked", {
      accessKeyId: claims.accessKeyId
    });

    callback(null, { token: claims.jti });
  };

  return withErrorHandlingAndValidation(
    revokeToken,
    V.revokeTokenRequestSchema
  );
}

export { createRevokeToken, RevokeTokenRequest };
