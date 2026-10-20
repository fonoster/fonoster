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
import { Usage } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { isPrivateRegionRef } from "../regions/types";
import { ingestUsageIn } from "./ingestUsage";
import { UsageDb, UsageDirectory } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const DAY_MS = 86_400_000;

const STORED_AT_END_OF_DAY = `
  SELECT access_key_id AS "workspaceRef", region, SUM(size)::bigint AS bytes
  FROM call_records
  WHERE access_key_id IS NOT NULL
    AND started_at < $1
    AND (erased_at IS NULL OR erased_at >= $1)
  GROUP BY access_key_id, region`;

/**
 * Records `storage.bytes` for one completed day (design D8): the bytes of call records each
 * workspace held at the end of that day, from index metadata only, one line per workspace and
 * region kind. The line's id is derived from the workspace and day, so running it again adds
 * nothing. Returns how many lines were new.
 */
export async function snapshotStorage(
  db: UsageDb,
  directory: UsageDirectory,
  day: string
): Promise<number> {
  const end = new Date(Date.parse(`${day}T00:00:00.000Z`) + DAY_MS);
  const rows = await db.$queryRawUnsafe<
    { workspaceRef: string; region: string; bytes: bigint }[]
  >(STORED_AT_END_OF_DAY, end);
  const totals = new Map<
    string,
    { workspaceRef: string; regionKind: string; region: string; bytes: number }
  >();
  rows.forEach((r) => {
    const regionKind = isPrivateRegionRef(r.region) ? "private" : "public";
    const key = `${r.workspaceRef}|${regionKind}`;
    const t = totals.get(key) ?? {
      workspaceRef: r.workspaceRef,
      regionKind,
      region: r.region,
      bytes: 0
    };
    t.bytes += Number(r.bytes);
    totals.set(key, t);
  });
  const line = { meter: "storage.bytes" as const };
  const events = Array.from(totals.values())
    .filter((t) => t.bytes > 0)
    .map((t) => ({
      ...line,
      quantity: t.bytes,
      id: Usage.usageId(`${t.workspaceRef}|${day}|${t.regionKind}`, line),
      workspaceRef: t.workspaceRef,
      region: t.region,
      regionKind: t.regionKind,
      origin: "api",
      occurredAt: new Date(end.getTime() - 1).toISOString()
    }));
  return db.$transaction((tx) => ingestUsageIn(tx, directory, events));
}

/** Snapshots yesterday (UTC) now and every hour; idempotent, so restarts and replicas are safe. */
export function runStorageSnapshots(deps: {
  db: UsageDb;
  directory: () => UsageDirectory | undefined;
  intervalMs?: number;
}): () => void {
  const tick = () => {
    const directory = deps.directory();
    if (!directory) return;
    const yesterday = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
    snapshotStorage(deps.db, directory, yesterday)
      .then(
        (n) =>
          n &&
          logger.info(
            `storage usage recorded for ${yesterday} (${n} workspaces)`
          )
      )
      .catch((e) => logger.warn(`storage usage snapshot failed: ${e.message}`));
  };
  const first = setTimeout(tick, 60_000);
  const timer = setInterval(tick, deps.intervalMs ?? 3_600_000);
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
