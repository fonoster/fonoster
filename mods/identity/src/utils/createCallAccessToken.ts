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
import { TokenUseEnum } from "../exchanges/TokenUseEnum";
import { IdentityConfig } from "../exchanges/types";
import { VOICE_SERVICE_ROLE } from "../roles";

const SIGN_ALGORITHM = "RS256";

function createCallAccessToken(identityConfig: IdentityConfig) {
  return async (params: {
    accessKeyId: string;
    appRef: string;
  }): Promise<string> => {
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

export { createCallAccessToken };
