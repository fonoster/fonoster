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

const logger = getLogger({ service: "identity", filePath: __filename });

/**
 * Fixed-window counter kept in this process's memory. With several replicas each enforces its own
 * limit, and a restart resets it: use createSharedRateLimiter in the service.
 */
function createRateLimiter(params: { limit: number; windowMs: number }) {
  const { limit, windowMs } = params;
  const windows = new Map<string, { startedAt: number; count: number }>();

  /** Counts one use of `key`; false when it's over the limit. */
  return function tryConsume(key: string, now = Date.now()): boolean {
    const window = windows.get(key);

    if (!window || now - window.startedAt >= windowMs) {
      windows.set(key, { startedAt: now, count: 1 });
      // Keep the map from growing without bound.
      if (windows.size > 10_000) {
        windows.forEach((w, k) => {
          if (now - w.startedAt >= windowMs) windows.delete(k);
        });
      }
      return true;
    }

    if (window.count >= limit) {
      return false;
    }

    window.count += 1;
    return true;
  };
}

type RawSql = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
  $executeRaw(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<number>;
};

/**
 * The same fixed-window counter in the Identity database (table rate_limit_windows), so the limit
 * holds across every replica and survives a restart (ST-4). One statement counts the use and
 * starts a new window when the old one is over. `name` keeps the counters of different limits
 * apart. If the database cannot be reached the use is counted in this process instead.
 */
function createSharedRateLimiter(
  prisma: unknown,
  params: { name: string; limit: number; windowMs: number }
) {
  const { name, limit, windowMs } = params;
  const local = createRateLimiter({ limit, windowMs });
  const db = prisma as Partial<RawSql>;
  if (typeof db.$queryRaw !== "function") {
    // A stand-in client without SQL (unit tests): this process only.
    return async (key: string) => local(`${name}:${key}`);
  }
  const sql = db as RawSql;
  let lastPrune = 0;

  return async function tryConsume(key: string): Promise<boolean> {
    const k = `${name}:${key}`.slice(0, 255);
    try {
      const rows = await sql.$queryRaw<{ count: number }[]>`
        INSERT INTO "rate_limit_windows" ("key", "started_at", "count")
        VALUES (${k}, now(), 1)
        ON CONFLICT ("key") DO UPDATE SET
          "started_at" = CASE
            WHEN "rate_limit_windows"."started_at" <= now() - (${windowMs} * interval '1 millisecond')
            THEN now() ELSE "rate_limit_windows"."started_at" END,
          "count" = CASE
            WHEN "rate_limit_windows"."started_at" <= now() - (${windowMs} * interval '1 millisecond')
            THEN 1 ELSE "rate_limit_windows"."count" + 1 END
        RETURNING "count"`;
      if (Date.now() - lastPrune > windowMs) {
        lastPrune = Date.now();
        void sql.$executeRaw`
          DELETE FROM "rate_limit_windows"
          WHERE "started_at" < now() - (${windowMs} * interval '1 millisecond')`.catch(
          () => undefined
        );
      }
      return Number(rows[0]?.count ?? 1) <= limit;
    } catch (e) {
      logger.warn(
        `rate limit ${name}: database unavailable (${(e as Error).message}); counting in this process`
      );
      return local(k);
    }
  };
}

export { createRateLimiter, createSharedRateLimiter };
