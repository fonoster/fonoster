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
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { SIGN_ALGORITHM } from "../constants";
import { Prisma } from "../db";
import * as AK from "./payloads/apikeys";
import * as US from "./payloads/users";
import { createRefreshTokenStore } from "./refreshTokens";
import { IdentityConfig } from "./types";

// prettier-ignore
function exchangeTokens(prisma: Prisma, identityConfig: IdentityConfig) {
  const refreshTokens = createRefreshTokenStore(prisma);

  /**
   * Issues tokens for `accessKeyId`. The refresh token gets a fresh `jti`,
   * recorded so it can be used once; `familyId` continues a rotation chain
   * (absent for a new sign-in).
   */
  return async (accessKeyId: string, options: { familyId?: string } = {}) => {
    const { privateKey, idTokenExpiresIn, accessTokenExpiresIn, refreshTokenExpiresIn } = identityConfig;
    const jti = randomUUID();
    const familyId = options.familyId ?? randomUUID();

    const idTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: idTokenExpiresIn } as jwt.SignOptions;
    const accessTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: accessTokenExpiresIn } as jwt.SignOptions;
    const refreshTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: refreshTokenExpiresIn, jwtid: jti } as jwt.SignOptions;

    let idToken = null;
    let accessToken = null;
    let refreshToken = null;

    if (accessKeyId.startsWith("US")) {
      const idTokenPayload = await US.createGetIdTokenPayload(prisma, identityConfig)(accessKeyId);
      const accessTokenPayload = await US.createGetAccessTokenPayload(prisma, identityConfig)(accessKeyId);
      const refreshTokenPayload = await US.createGetRefreshTokenPayload(prisma, identityConfig)(accessKeyId);

      idToken = jwt.sign(idTokenPayload, privateKey, idTokenSignOptions);
      accessToken = jwt.sign(accessTokenPayload, privateKey, accessTokenSignOptions);
      refreshToken = jwt.sign(refreshTokenPayload, privateKey, refreshTokenSignOptions);
    } else {
      const accessTokenPayload = await AK.createGetAccessTokenPayload(prisma, identityConfig)(accessKeyId);
      const refreshTokenPayload = await AK.createGetRefreshTokenPayload(prisma, identityConfig)(accessKeyId);

      accessToken = jwt.sign(accessTokenPayload, privateKey, accessTokenSignOptions);
      refreshToken = jwt.sign(refreshTokenPayload, privateKey, refreshTokenSignOptions);
    }

    const { exp } = jwt.decode(refreshToken) as { exp: number };

    await refreshTokens.record({
      jti,
      familyId,
      accessKeyId,
      expiresAt: new Date(exp * 1000)
    });

    return {
      idToken,
      accessToken,
      refreshToken
    };
  }
}

export { exchangeTokens };
