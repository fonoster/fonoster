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
import { Prisma } from "../../../../db";
import { GroupRoleEnum } from "../../../groups";
import TokenUseEnum from "../../TokenUseEnum";
import { AccessToken, IdentityConfig } from "../../types";

function getAccessTokenPayload(prisma: Prisma, identityConfig: IdentityConfig) {
  return async (accessKeyId: string): Promise<AccessToken> => {
    const apiKey = await prisma.aPIKey.findFirst({
      where: {
        accessKeyId
      },
      include: {
        group: true
      }
    });

    if (!apiKey) {
      return null;
    }

    const { issuer, audience } = identityConfig;
    const { id, group } = apiKey;

    const access = [
      {
        accessKeyId: group.accessKeyId,
        role: apiKey.role as GroupRoleEnum
      }
    ];

    return {
      iss: issuer,
      sub: id,
      aud: audience,
      tokenUse: TokenUseEnum.ACCESS,
      accessKeyId,
      access
    } as AccessToken;
  };
}

export { getAccessTokenPayload };
