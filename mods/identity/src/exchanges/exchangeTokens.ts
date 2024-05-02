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
import jwt from "jsonwebtoken";
import * as AK from "./payloads/apikeys";
import * as US from "./payloads/users";
import { IdentityConfig } from "./types";
import { Prisma } from "../db";

const SIGN_ALGORITHM = "RS256";

// prettier-ignore
function exchangeTokens(prisma: Prisma, identityConfig: IdentityConfig) {
  return async (accessKeyId: string) => {
    const { privateKey, idTokenExpiresIn, accessTokenExpiresIn, refreshTokenExpiresIn } = identityConfig;

    const idTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: idTokenExpiresIn } as jwt.SignOptions;
    const accessTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: accessTokenExpiresIn } as jwt.SignOptions;
    const refreshTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: refreshTokenExpiresIn } as jwt.SignOptions;

    let idToken = null;
    let accessToken = null;
    let refreshToken = null;

    if (accessKeyId.startsWith("US")) {
      const idTokenPayload = await US.getIdTokenPayload(prisma, identityConfig)(accessKeyId);
      const accessTokenPayload = await US.getAccessTokenPayload(prisma, identityConfig)(accessKeyId);
      const refreshTokenPayload = await US.getRefreshTokenPayload(prisma, identityConfig)(accessKeyId);

      idToken = jwt.sign(idTokenPayload, privateKey, idTokenSignOptions);
      accessToken = jwt.sign(accessTokenPayload, privateKey, accessTokenSignOptions);
      refreshToken = jwt.sign(refreshTokenPayload, privateKey, refreshTokenSignOptions);
    } else {
      const accessTokenPayload = await AK.getAccessTokenPayload(prisma, identityConfig)(accessKeyId);
      const refreshTokenPayload = await AK.getRefreshTokenPayload(prisma, identityConfig)(accessKeyId);

      accessToken = jwt.sign(accessTokenPayload, privateKey, accessTokenSignOptions);
      refreshToken = jwt.sign(refreshTokenPayload, privateKey, refreshTokenSignOptions);
    }

    return {
      idToken,
      accessToken,
      refreshToken
    };
  }
}

export { exchangeTokens };
