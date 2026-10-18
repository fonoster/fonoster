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
import { randomUUID } from "crypto";
import { RegionsDb } from "./types";

/**
 * Concurrent relays per private region (ST-4). `acquire` answers a release function, or
 * undefined when the region already has `max` relays in flight.
 */
export type RelaySlots = {
  acquire(regionRef: string, max: number): Promise<(() => void) | undefined>;
};

/** This process only: with N replicas a region gets up to N × max (tests, no database). */
export function memoryRelaySlots(): RelaySlots {
  const inFlight = new Map<string, number>();
  return {
    async acquire(regionRef, max) {
      const busy = inFlight.get(regionRef) ?? 0;
      if (busy >= max) return undefined;
      inFlight.set(regionRef, busy + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        const n = (inFlight.get(regionRef) ?? 1) - 1;
        if (n > 0) inFlight.set(regionRef, n);
        else inFlight.delete(regionRef);
      };
    }
  };
}

/**
 * Slots shared by every apiserver replica: one row per (region, slot number) in Postgres, leased
 * by the replica relaying the download and refreshed while it runs, so the limit holds across the
 * cluster and a slot of a replica that died frees itself when its lease runs out.
 */
export function prismaRelaySlots(
  db: RegionsDb,
  options: { leaseMs?: number } = {}
): RelaySlots {
  const leaseMs = options.leaseMs ?? 30_000;
  return {
    async acquire(regionRef, max) {
      const holder = randomUUID();
      // Takes the lowest slot that is free or whose lease ran out. Two replicas racing for the
      // same slot: the primary key lets one in, the other tries again.
      for (let attempt = 0; attempt < 3; attempt++) {
        const rows: { slot: number }[] = await db.$queryRaw`
          INSERT INTO "region_relay_slots" ("region_ref", "slot", "holder", "expires_at")
          SELECT ${regionRef}, s, ${holder}, now() + (${leaseMs} * interval '1 millisecond')
          FROM generate_series(0, ${max}::int - 1) AS s
          WHERE s NOT IN (
            SELECT "slot" FROM "region_relay_slots"
            WHERE "region_ref" = ${regionRef} AND "expires_at" > now()
          )
          ORDER BY s
          LIMIT 1
          ON CONFLICT ("region_ref", "slot") DO UPDATE
            SET "holder" = EXCLUDED."holder", "expires_at" = EXCLUDED."expires_at"
            WHERE "region_relay_slots"."expires_at" <= now()
          RETURNING "slot"`;
        if (rows.length) {
          const slot = rows[0].slot;
          const refresh = setInterval(
            () =>
              void db.$executeRaw`
                UPDATE "region_relay_slots"
                SET "expires_at" = now() + (${leaseMs} * interval '1 millisecond')
                WHERE "region_ref" = ${regionRef} AND "slot" = ${slot} AND "holder" = ${holder}`.catch(
                () => undefined
              ),
            Math.max(1000, Math.floor(leaseMs / 3))
          );
          refresh.unref?.();
          let released = false;
          return () => {
            if (released) return;
            released = true;
            clearInterval(refresh);
            void db.$executeRaw`
              DELETE FROM "region_relay_slots"
              WHERE "region_ref" = ${regionRef} AND "slot" = ${slot} AND "holder" = ${holder}`.catch(
              () => undefined
            );
          };
        }
        const [{ busy }]: { busy: number }[] = await db.$queryRaw`
          SELECT count(*)::int AS busy FROM "region_relay_slots"
          WHERE "region_ref" = ${regionRef} AND "expires_at" > now()`;
        if (busy >= max) return undefined;
      }
      return undefined;
    }
  };
}
