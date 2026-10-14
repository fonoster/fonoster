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
import { getLogger } from "@fonoster/logger";
import { Prisma } from "../db";
import {
  equalsInConstantTime,
  hashPassword,
  verifyPasswordDigest
} from "./passwords";

const logger = getLogger({ service: "identity", filePath: __filename });

const BACKFILL_BATCH_SIZE = 500;

type UserWithPassword = {
  ref: string;
  password?: string | null;
  passwordDigest?: string | null;
};

/**
 * Columns to write when setting a password: the digest only, clearing the
 * legacy encrypted value.
 */
async function passwordColumns(password: string) {
  return { passwordDigest: await hashPassword(password), password: null };
}

/**
 * Verifies a user's password. Users from before digests existed are checked
 * against their decrypted legacy password, then migrated to a digest.
 */
function createVerifyUserPassword(prisma: Prisma) {
  return async (user: UserWithPassword, password: string) => {
    if (!password) {
      return false;
    }

    if (user.passwordDigest) {
      return verifyPasswordDigest(password, user.passwordDigest);
    }

    if (!user.password || !equalsInConstantTime(user.password, password)) {
      return false;
    }

    await prisma.user.update({
      where: { ref: user.ref },
      data: await passwordColumns(password)
    });

    return true;
  };
}

/**
 * Moves every remaining legacy password to a digest. Batched and idempotent:
 * only users with a legacy value and no digest are touched.
 */
async function backfillPasswordDigests(prisma: Prisma) {
  const migrateBatch = async (): Promise<number> => {
    const users = await prisma.user.findMany({
      where: { passwordDigest: null, password: { not: null } },
      select: { ref: true, password: true },
      take: BACKFILL_BATCH_SIZE
    });

    if (users.length === 0) {
      return 0;
    }

    // One at a time: each scrypt derivation holds ~32 MiB.
    await users.reduce(
      (previous, user) =>
        previous.then(async () => {
          await prisma.user.update({
            where: { ref: user.ref },
            data: await passwordColumns(user.password as string)
          });
        }),
      Promise.resolve()
    );

    return users.length + (await migrateBatch());
  };

  const migrated = await migrateBatch();

  if (migrated > 0) {
    logger.info("moved legacy passwords to digests", { users: migrated });
  }

  return migrated;
}

export { backfillPasswordDigests, createVerifyUserPassword, passwordColumns };
