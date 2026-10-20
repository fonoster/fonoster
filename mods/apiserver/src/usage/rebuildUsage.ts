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
import {
  indexEntry,
  RecordIndexEntry,
  RecordStore,
  SignedVcon,
  Vcon
} from "@fonoster/callrecord";
import { Usage } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { usageEvents } from "../records/createIndexRecord";
import { ingestUsageIn } from "./ingestUsage";
import { UsageDb, UsageDirectory } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const SNAPSHOT_METERS = Usage.METER_NAMES.filter(
  (m) => Usage.METERS[m].aggregation === "snapshot"
);

const KEY = `owner_ref, workspace_ref, (occurred_at AT TIME ZONE 'UTC')::date, meter,
  COALESCE(provider, ''), COALESCE(model, ''), COALESCE(key_source, ''), origin, region_kind`;

/**
 * Recomputes usage_daily for [fromDay, toDay] (UTC, inclusive) from usage_events alone, in one
 * transaction (design D7). Sum meters add up; snapshot meters keep the latest reading of the day.
 */
export async function rebuildUsageDaily(
  db: UsageDb,
  fromDay: string,
  toDay: string
): Promise<number> {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      "DELETE FROM usage_daily WHERE day BETWEEN $1::date AND $2::date",
      fromDay,
      toDay
    );
    const range = `(occurred_at AT TIME ZONE 'UTC')::date BETWEEN $1::date AND $2::date`;
    const sums = await tx.$executeRawUnsafe(
      `INSERT INTO usage_daily (owner_ref, workspace_ref, day, meter, provider, model, key_source,
         origin, region_kind, quantity)
       SELECT ${KEY}, SUM(quantity) FROM usage_events
       WHERE ${range} AND NOT (meter = ANY($3::text[]))
       GROUP BY ${KEY}`,
      fromDay,
      toDay,
      SNAPSHOT_METERS
    );
    const snapshots = await tx.$executeRawUnsafe(
      `INSERT INTO usage_daily (owner_ref, workspace_ref, day, meter, provider, model, key_source,
         origin, region_kind, quantity)
       SELECT DISTINCT ON (${KEY}) ${KEY}, quantity FROM usage_events
       WHERE ${range} AND meter = ANY($3::text[])
       ORDER BY ${KEY}, occurred_at DESC, recorded_at DESC`,
      fromDay,
      toDay,
      SNAPSHOT_METERS
    );
    return sums + snapshots;
  });
}

type IndexedCall = {
  callRef: string;
  location: string;
  region: string;
  status: string;
};

const vconOf = (signed: SignedVcon): Vcon =>
  JSON.parse(Buffer.from(signed.payload, "base64url").toString("utf8"));

/**
 * Re-reads the sealed records of calls that started in [fromDay, toDay] and stores any usage
 * missing from usage_events (Risks: index messages lost while the apiserver was down). Records
 * of private regions stay in their cell and cannot be read here. Returns how many lines were new.
 */
export async function recoverUsageFromRecords(deps: {
  db: UsageDb & {
    callRecord: {
      findMany(args: Record<string, unknown>): Promise<IndexedCall[]>;
    };
  };
  directory: UsageDirectory;
  storeFor: (location: string) => RecordStore | undefined;
  fromDay: string;
  toDay: string;
}): Promise<number> {
  const calls = await deps.db.callRecord.findMany({
    where: {
      startedAt: {
        gte: new Date(`${deps.fromDay}T00:00:00.000Z`),
        lt: new Date(Date.parse(`${deps.toDay}T00:00:00.000Z`) + 86_400_000)
      },
      status: { not: "erased" }
    },
    select: { callRef: true, location: true, region: true, status: true }
  });
  let inserted = 0;
  for (const call of calls) {
    const store = deps.storeFor(call.location);
    if (!store) {
      logger.warn(`no store for ${call.callRef} (${call.location}); skipped`);
      continue;
    }
    const sealed = await store.getSealed(call.callRef).catch(() => undefined);
    if (!sealed) continue;
    const entry: RecordIndexEntry = indexEntry(
      call.callRef,
      sealed,
      vconOf(sealed.signed),
      {
        region: call.region,
        location: call.location
      }
    );
    if (!entry.workspaceRef || !entry.usage?.length) continue;
    const events = usageEvents(entry, entry.workspaceRef);
    inserted += await deps.db.$transaction((tx) =>
      ingestUsageIn(tx, deps.directory, events)
    );
  }
  return inserted;
}
