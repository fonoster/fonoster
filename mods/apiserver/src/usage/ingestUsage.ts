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
import { UsageDirectory, UsageSql } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const INSERT_EVENT = `
  INSERT INTO usage_events (id, owner_ref, workspace_ref, app_ref, call_ref, region, region_kind,
    origin, meter, unit, quantity, provider, model, key_source, occurred_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  ON CONFLICT (id) DO NOTHING
  RETURNING id`;

const upsertDaily = (aggregation: Usage.UsageAggregation) => `
  INSERT INTO usage_daily (owner_ref, workspace_ref, day, meter, provider, model, key_source,
    origin, region_kind, quantity, updated_at)
  VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, now())
  ON CONFLICT (owner_ref, workspace_ref, day, meter, provider, model, key_source, origin, region_kind)
  DO UPDATE SET quantity = ${
    aggregation === "sum"
      ? "usage_daily.quantity + EXCLUDED.quantity"
      : "EXCLUDED.quantity"
  }, updated_at = now()`;

/**
 * Stores usage events in a transaction the caller owns (design D7): each event once, by its id,
 * and the day's total grows only when the event was new, so a replay changes nothing. Events that
 * fail validation are logged and skipped. Returns how many events were new.
 */
export async function ingestUsageIn(
  tx: UsageSql,
  directory: UsageDirectory,
  events: unknown[]
): Promise<number> {
  const owners = new Map<string, string>();
  const ownerOf = async (workspaceRef: string) => {
    if (!owners.has(workspaceRef)) {
      const ws = await directory.workspace(workspaceRef).catch(() => undefined);
      if (!ws)
        logger.warn(
          `usage for unknown workspace ${workspaceRef}; owner left empty`
        );
      owners.set(workspaceRef, ws?.ownerRef ?? "");
    }
    return owners.get(workspaceRef) as string;
  };
  let inserted = 0;
  for (const input of events) {
    let event: Usage.UsageEvent;
    try {
      event = Usage.parseUsageEvent(input);
    } catch (e) {
      logger.warn(`usage line rejected: ${(e as Error).message}`);
      continue;
    }
    const meter = Usage.meterOf(event.meter);
    const ownerRef = event.ownerRef ?? (await ownerOf(event.workspaceRef));
    const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
      INSERT_EVENT,
      event.id,
      ownerRef,
      event.workspaceRef,
      event.appRef ?? null,
      event.callRef ?? null,
      event.region,
      event.regionKind,
      event.origin,
      event.meter,
      meter.unit,
      BigInt(Math.round(event.quantity)),
      event.provider ?? null,
      event.model ?? null,
      event.keySource ?? null,
      new Date(event.occurredAt)
    );
    if (rows.length === 0) continue;
    inserted++;
    await tx.$executeRawUnsafe(
      upsertDaily(meter.aggregation),
      ownerRef,
      event.workspaceRef,
      event.occurredAt.slice(0, 10),
      event.meter,
      event.provider ?? "",
      event.model ?? "",
      event.keySource ?? "",
      event.origin,
      event.regionKind,
      BigInt(Math.round(event.quantity))
    );
  }
  return inserted;
}
