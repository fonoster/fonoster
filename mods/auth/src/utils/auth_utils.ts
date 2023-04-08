/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import JwtPayload from "./jwt_payload";
import ITokenManager from "./itoken_manager";
import logger from "@fonoster/logger";

export declare interface UserToken {
  accessToken: string;
}

export declare interface TokenResponse {
  isValid: boolean;
  data: JwtPayload;
}

export default class AuthUtils {
  private handler: ITokenManager;

  constructor(handler: ITokenManager) {
    this.handler = handler;
  }

  public validateTokenData = (payload: JwtPayload): boolean => {
    if (
      !payload ||
      !payload.iss ||
      !payload.accessKeyId ||
      !payload.iss ||
      !payload.role
    )
      throw new Error("Invalid Access Token");
    return true;
  };

  public createToken = async (
    accessKeyId: string,
    issuer: string,
    role: string,
    privateKey: string,
    expiration?: string
  ): Promise<UserToken> => {
    const accessToken = await this.handler.encode(
      new JwtPayload(issuer, role, accessKeyId),
      privateKey,
      expiration
    );

    if (!accessToken) throw new Error("Error creating token");

    return {
      accessToken: accessToken
    } as UserToken;
  };

  public validateToken = async (
    token: UserToken,
    privateKey: string
  ): Promise<TokenResponse> => {
    let result = false;
    try {
      const accessTokenData = await this.handler.decode(
        token.accessToken,
        privateKey
      );
      if (accessTokenData) {
        result = true;
      }

      return {
        data: accessTokenData,
        isValid: result
      } as TokenResponse;
    } catch (e) {
      logger.log("error", "@fonoster/auth [Error decoding token]");
    }
    return {
      isValid: result
    } as TokenResponse;
  };
}
