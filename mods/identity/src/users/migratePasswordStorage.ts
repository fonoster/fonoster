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
import { createPrismaClient } from "../db";
import { IdentityConfig } from "../exchanges/types";
import { backfillPasswordDigests } from "../utils/userPasswords";

/**
 * Boot-time step: moves passwords still stored with reversible encryption to
 * one-way digests. Idempotent, so it runs on every start.
 */
async function migratePasswordStorage(identityConfig: IdentityConfig) {
  const prisma = createPrismaClient(
    identityConfig.dbUrl,
    identityConfig.encryptionKey
  );

  try {
    return await backfillPasswordDigests(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

export { migratePasswordStorage };
