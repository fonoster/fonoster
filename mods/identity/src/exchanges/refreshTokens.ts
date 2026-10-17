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
import { REFRESH_TOKEN_REUSE_GRACE_MS } from "../constants";
import { Prisma } from "../db";

type ConsumeResult =
  | { status: "ok"; familyId: string; accessKeyId: string }
  | { status: "reused" | "unknown" };

/**
 * Issued refresh tokens, by `jti`. A token is good for one exchange: using it
 * marks it used and the exchange issues the next token in the same family. A
 * token presented again (or after revocation) revokes the whole family, so a
 * stolen token stops working for the thief and the owner alike. A token used
 * moments ago (REFRESH_TOKEN_REUSE_GRACE_MS) may be used again, so two tabs
 * renewing the same session at once don't sign each other out.
 */
function createRefreshTokenStore(prisma: Prisma) {
  return {
    async record(token: {
      jti: string;
      familyId: string;
      accessKeyId: string;
      expiresAt: Date;
    }) {
      // Expired rows are no longer useful; drop this principal's on the way.
      await prisma.refreshToken.deleteMany({
        where: { accessKeyId: token.accessKeyId, expiresAt: { lt: new Date() } }
      });
      await prisma.refreshToken.create({ data: token });
    },

    /** Marks `jti` used, once. A second use revokes its family. */
    async consume(jti: string): Promise<ConsumeResult> {
      const now = new Date();
      const { count } = await prisma.refreshToken.updateMany({
        where: {
          jti,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: now }
        },
        data: { usedAt: now }
      });

      const row = await prisma.refreshToken.findUnique({ where: { jti } });

      if (!row) {
        return { status: "unknown" };
      }

      const inGrace =
        row.usedAt !== null &&
        row.revokedAt === null &&
        row.expiresAt > now &&
        now.getTime() - row.usedAt.getTime() < REFRESH_TOKEN_REUSE_GRACE_MS;

      if (count !== 1 && !inGrace) {
        await this.revokeFamily(row.familyId);
        return { status: "reused" };
      }

      return {
        status: "ok",
        familyId: row.familyId,
        accessKeyId: row.accessKeyId
      };
    },

    async revokeFamily(familyId: string) {
      await prisma.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    },

    /** Signs a user or API key out everywhere (password reset, key rotation). */
    async revokeAll(accessKeyId: string) {
      await prisma.refreshToken.updateMany({
        where: { accessKeyId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
  };
}

export { createRefreshTokenStore };
