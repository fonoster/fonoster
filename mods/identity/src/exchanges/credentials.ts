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
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getAccessTokenPayload } from "./payloads/users/getAccessTokenPayload";
import { getIdTokenPayload } from "./payloads/users/getIdTokenPayload";
import { getRefreshTokenPayload } from "./payloads/users/getRefreshTokenPayload";
import { IdentityConfig } from "./types";
import { Prisma } from "../db";
import { GRPCErrors, handleError } from "../errors";
import { getUserByEmail } from "../utils/getUserByEmail";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const ExchangeCredentialsRequestSchema = z.object({
  username: z.string(),
  password: z.string()
});

type ExchangeCredentialsRequest = z.infer<
  typeof ExchangeCredentialsRequestSchema
>;

type ExchangeCredentialsResponse = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

const SIGN_ALGORITHM = "RS256";

// prettier-ignore
function exchangeCredentials(prisma: Prisma, identityConfig: IdentityConfig) {
  return async (
    call: { request: ExchangeCredentialsRequest },
    callback: (
      error: GRPCErrors,
      response?: ExchangeCredentialsResponse
    ) => void
  ) => {
    try {
      const { privateKey, idTokenExpiresIn, accessTokenExpiresIn, refreshTokenExpiresIn } = identityConfig;

      const idTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: idTokenExpiresIn } as jwt.SignOptions;
      const accessTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: accessTokenExpiresIn } as jwt.SignOptions;
      const refreshTokenSignOptions = { algorithm: SIGN_ALGORITHM, expiresIn: refreshTokenExpiresIn } as jwt.SignOptions;

      const validatedRequest = ExchangeCredentialsRequestSchema.parse(call.request);
      const { username, password } = validatedRequest;

      logger.verbose("call to exchangeCredentials", { username });

      const user = await getUserByEmail(prisma)(username);
  
      if (!user) {
        return callback({ code: grpc.status.PERMISSION_DENIED, message: "Invalid credentials" });
      }

      if (user.password !== password?.trim()) {
        return callback({ code: grpc.status.PERMISSION_DENIED, message: "Invalid credentials" });
      }

      const idTokenPayload = await getIdTokenPayload(prisma, identityConfig)(user.accessKeyId);
      const accessTokenPayload = await getAccessTokenPayload(prisma, identityConfig)(user.accessKeyId);
      const refreshTokenPayload = await getRefreshTokenPayload(prisma, identityConfig)(user.accessKeyId);
 
      const idToken = jwt.sign(idTokenPayload, privateKey, idTokenSignOptions);
      const accessToken = jwt.sign(accessTokenPayload, privateKey, accessTokenSignOptions);
      const refreshToken = jwt.sign(refreshTokenPayload, privateKey, refreshTokenSignOptions);

      return callback(null, {
        idToken,
        accessToken,
        refreshToken
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { exchangeCredentials };
