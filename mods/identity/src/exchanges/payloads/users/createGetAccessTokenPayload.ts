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
import { AccessToken, TokenUseEnum } from "@fonoster/common";
import { Role, WorkspaceMemberStatus } from "@fonoster/types";
import { Prisma } from "../../../db";
import { IdentityConfig } from "../../types";

function createGetAccessTokenPayload(
  prisma: Prisma,
  identityConfig: IdentityConfig
) {
  return async function createGetAccessTokenPayload(
    accessKeyId: string
  ): Promise<AccessToken> {
    const user = await prisma.user.findFirst({
      where: {
        accessKeyId
      },
      include: {
        ownedWorkspaces: true,
        memberships: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    const { issuer, audience } = identityConfig;
    const { ref, ownedWorkspaces, memberships } = user;

    const access = ownedWorkspaces.map((workspace) => ({
      accessKeyId: workspace.accessKeyId,
      role: Role.WORKSPACE_OWNER
    }));

    memberships.forEach((membership) => {
      membership.status === WorkspaceMemberStatus.ACTIVE &&
        access.push({
          accessKeyId: membership.workspace.accessKeyId,
          role: membership.role as Role
        });
    });

    return {
      iss: issuer,
      sub: ref,
      aud: audience,
      tokenUse: TokenUseEnum.ACCESS,
      accessKeyId,
      access
    } as AccessToken;
  };
}

export { createGetAccessTokenPayload };
