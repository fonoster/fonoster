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
import { TokenUseEnum, VOICE_SERVICE_ROLE } from "@fonoster/common";
import jwt from "jsonwebtoken";
import { SIGN_ALGORITHM } from "../constants";
import { IdentityConfig } from "../exchanges/types";

function createGenerateCallAccessToken(identityConfig: IdentityConfig) {
  return async function generateCallAccessToken(params: {
    accessKeyId: string;
    appRef: string;
  }): Promise<string> {
    const { privateKey } = identityConfig;

    const accessTokenSignOptions = {
      algorithm: SIGN_ALGORITHM,
      // Just enough time to validate a request
      expiresIn: "30s"
    } as jwt.SignOptions;

    const { issuer, audience } = identityConfig;
    const { accessKeyId, appRef } = params;

    const access = [
      {
        accessKeyId,
        role: VOICE_SERVICE_ROLE
      }
    ];

    const unsignedToken = {
      iss: issuer,
      sub: appRef,
      aud: audience,
      tokenUse: TokenUseEnum.ACCESS,
      accessKeyId,
      access
    };

    return jwt.sign(unsignedToken, privateKey, accessTokenSignOptions);
  };
}

export { createGenerateCallAccessToken };
