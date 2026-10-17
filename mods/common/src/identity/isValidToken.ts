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
import { getLogger } from "@fonoster/logger";
import jwt from "jsonwebtoken";
import { JsonWebErrorEnum } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

/** Identity signs every token with RS256; nothing else is accepted. */
const IDENTITY_SIGN_ALGORITHMS: jwt.Algorithm[] = ["RS256"];

/** Claims to pin when verifying; each one is checked only when given. */
type TokenVerifyOptions = {
  issuer?: string;
  audience?: string;
};

/** The verified claims, or undefined when the signature, expiry or claims don't check out. */
function verifyToken(
  token: string,
  secret: string,
  options: TokenVerifyOptions = {}
): Record<string, unknown> | undefined {
  if (!token || typeof token !== "string") {
    return undefined;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: IDENTITY_SIGN_ALGORITHMS,
      ...(options.issuer ? { issuer: options.issuer } : {}),
      ...(options.audience ? { audience: options.audience } : {})
    });

    if (!decoded || typeof decoded !== "object") {
      return undefined;
    }

    const { exp } = decoded as { exp?: number };
    const currentTime = Math.floor(Date.now() / 1000);

    if (typeof exp !== "number" || exp <= currentTime) {
      logger.verbose("token expired or without expiry", { exp, currentTime });
      return undefined;
    }

    return decoded as Record<string, unknown>;
  } catch (error) {
    if (error.name === JsonWebErrorEnum.JsonWebTokenError) {
      logger.verbose("invalid JWT token");
    } else if (error.name === JsonWebErrorEnum.TokenExpiredError) {
      logger.verbose("token expired");
    } else {
      logger.verbose("unexpected JWT error:", error);
    }

    return undefined;
  }
}

function isValidToken(
  token: string,
  secret: string,
  options: TokenVerifyOptions = {}
): boolean {
  return verifyToken(token, secret, options) !== undefined;
}

export {
  IDENTITY_SIGN_ALGORITHMS,
  isValidToken,
  TokenVerifyOptions,
  verifyToken
};
