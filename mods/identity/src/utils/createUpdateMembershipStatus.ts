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
import { TokenUseEnum, verifyToken } from "@fonoster/common";
import { WorkspaceMemberStatus } from "@fonoster/types";
import { createPrismaClient } from "../db";
import { IdentityConfig } from "../exchanges";

function createUpdateMembershipStatus(identityConfig: IdentityConfig) {
  const prisma = createPrismaClient(
    identityConfig.dbUrl,
    identityConfig.encryptionKey
  );

  return async function pdateMembershipStatus(token: string): Promise<void> {
    const claims = verifyToken(token, identityConfig.privateKey, {
      issuer: identityConfig.issuer,
      audience: identityConfig.audience
    });

    // Invite tokens only (older ones carry no tokenUse); never a session token.
    if (
      !claims ||
      (claims.tokenUse !== undefined &&
        claims.tokenUse !== TokenUseEnum.INVITE) ||
      typeof claims.memberRef !== "string"
    ) {
      throw new Error("Invalid token");
    }

    const { memberRef } = claims as { memberRef: string };

    await prisma.workspaceMember.update({
      where: {
        ref: memberRef
      },
      data: {
        status: WorkspaceMemberStatus.ACTIVE,
        updatedAt: new Date()
      }
    });
  };
}

export { createUpdateMembershipStatus };
