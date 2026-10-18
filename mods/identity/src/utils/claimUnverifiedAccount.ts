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
import { Prisma } from "../db";
import { createRefreshTokenStore } from "../exchanges/refreshTokens";

type ClaimableUser = {
  ref: string;
  accessKeyId: string;
  emailVerified: boolean;
};

/**
 * Called when someone proves they own an account's email (an emailed code, or
 * a GitHub account with that verified email) and signs in with it. If the
 * email had never been verified, whoever set the account's password may not
 * own the address (they could have signed up with someone else's email before
 * its owner did), so that password stops working and every session of the
 * account ends. The email is marked verified. Already verified accounts are
 * returned unchanged.
 */
function createClaimUnverifiedAccount(prisma: Prisma) {
  const refreshTokens = createRefreshTokenStore(prisma);

  return async function claimUnverifiedAccount<T extends ClaimableUser>(
    user: T
  ): Promise<T> {
    if (user.emailVerified) {
      return user;
    }

    const claimed = await prisma.user.update({
      where: { ref: user.ref },
      data: {
        emailVerified: true,
        password: null,
        passwordDigest: null,
        mustChangePassword: false
      }
    });

    await refreshTokens.revokeAll(user.accessKeyId);

    return claimed as unknown as T;
  };
}

export { createClaimUnverifiedAccount };
