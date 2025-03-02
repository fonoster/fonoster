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
import { RefreshToken, TokenUseEnum } from "@fonoster/common";
import { IdentityConfig } from "../types";

function buildRefreshTokenPayload(params: {
  identityConfig: IdentityConfig;
  accessKeyId: string;
  identityRef: string;
}) {
  const { identityConfig, accessKeyId, identityRef } = params;
  const { issuer, audience } = identityConfig;

  return {
    iss: issuer,
    sub: identityRef,
    aud: audience,
    tokenUse: TokenUseEnum.REFRESH,
    accessKeyId
  } as RefreshToken;
}

export { buildRefreshTokenPayload };
