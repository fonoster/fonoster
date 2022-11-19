/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { promisify } from "util";
import { sign, verify } from "jsonwebtoken";
import logger from "@fonoster/logger";
import JwtPayload from "./jwt_payload";
import ITokenManager from "./itoken_manager";
/*
 * issuer 		— Organization who issue the toke.
 * role       — User role
 * accessKey  — User access key
 * expiresIn	— Expiration time after which the token will be invalid.
 * algorithm 	— Encryption algorithm to be used to protect the token.
 */
export default class JWT implements ITokenManager {
  async encode(
    payload: JwtPayload,
    privateKey: string,
    expiresIn = "30d"
  ): Promise<string> {
    if (!privateKey) throw new Error("Token generation failure");
    // @ts-ignore
    return promisify(sign)({ ...payload }, privateKey, {
      expiresIn
    });
  }

  /**
   * Returns the decoded payload if the signature is valid even if it is expired
   */
  async decode(token: string, privateKey: string): Promise<JwtPayload> {
    try {
      // @ts-ignore
      return (await promisify(verify)(token, privateKey, {
        ignoreExpiration: false
      })) as JwtPayload;
    } catch (e) {
      logger.log("error", "@fonoster/auth [Bad token]");
      throw new Error(e);
    }
  }
}
