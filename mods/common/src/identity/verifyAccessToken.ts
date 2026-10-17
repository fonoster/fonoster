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
import { TokenVerifyOptions, verifyToken } from "./isValidToken";
import { Access, AccessToken, TokenUseEnum } from "./types";

const isAccessEntry = (entry: unknown): entry is Access =>
  typeof entry === "object" &&
  entry !== null &&
  typeof (entry as Access).accessKeyId === "string" &&
  typeof (entry as Access).role === "string";

/**
 * Verifies `token` and returns it only when it is an access token: signed by
 * Identity (RS256), unexpired, `tokenUse: "access"`, with a string
 * `accessKeyId` and a well-formed `access` array. Id, refresh, invite and other
 * signed tokens are refused (undefined), as is anything malformed.
 */
function verifyAccessToken(
  token: string,
  identityPublicKey: string,
  options: TokenVerifyOptions = {}
): AccessToken | undefined {
  const claims = verifyToken(token, identityPublicKey, options);

  if (
    !claims ||
    claims.tokenUse !== TokenUseEnum.ACCESS ||
    typeof claims.accessKeyId !== "string" ||
    !Array.isArray(claims.access) ||
    !claims.access.every(isAccessEntry)
  ) {
    return undefined;
  }

  return claims as unknown as AccessToken;
}

export { verifyAccessToken };
