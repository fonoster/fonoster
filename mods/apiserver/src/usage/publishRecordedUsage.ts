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
import {
  nanos,
  NatsConnection,
  RetentionPolicy,
  StorageType,
  StringCodec
} from "nats";
import { UsageSql } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/**
 * Stored usage for billing (add-billing-service D2). Not under `usage.>`, which FONOSTER_USAGE
 * owns: these are facts already stored, not usage to store.
 */
export const RECORDED_USAGE_STREAM = "FONOSTER_USAGE_RECORDED";
export const RECORDED_USAGE_SUBJECTS = "billing.usage.>";
/** Kept this long while billing is not consuming. */
export const RECORDED_USAGE_MAX_AGE_MS = 7 * 24 * 3600_000;

/** The subject an owner's stored usage is published on. */
export const recordedUsageSubject = (ownerRef: string) =>
  `billing.usage.${ownerRef}`;

/** A stored usage event as billing receives it: the usage.v1 event plus its owner. */
export type RecordedUsage = Usage.UsageEvent & { ownerRef: string };

type Row = {
  id: string;
  owner_ref: string;
  workspace_ref: string;
  app_ref: string | null;
  call_ref: string | null;
  region: string;
  region_kind: string;
  origin: string;
  meter: string;
  quantity: bigint | number | string;
  provider: string | null;
  model: string | null;
  key_source: string | null;
  occurred_at: Date;
};

const toRecorded = (r: Row): RecordedUsage =>
  ({
    id: r.id,
    ownerRef: r.owner_ref,
    workspaceRef: r.workspace_ref,
    ...(r.app_ref ? { appRef: r.app_ref } : {}),
    ...(r.call_ref ? { callRef: r.call_ref } : {}),
    region: r.region,
    regionKind: r.region_kind,
    origin: r.origin,
    meter: r.meter,
    quantity: Number(r.quantity),
    ...(r.provider ? { provider: r.provider } : {}),
    ...(r.model ? { model: r.model } : {}),
    ...(r.key_source ? { keySource: r.key_source } : {}),
    occurredAt: r.occurred_at.toISOString()
  }) as RecordedUsage;

const inUse = (e: unknown) =>
  /already in use|already exists/i.test((e as Error).message ?? "");

/** Creates the stream billing consumes, if it does not exist. */
export async function ensureRecordedUsageStream(nc: NatsConnection) {
  const jsm = await nc.jetstreamManager();
  try {
    await jsm.streams.info(RECORDED_USAGE_STREAM);
  } catch {
    await jsm.streams
      .add({
        name: RECORDED_USAGE_STREAM,
        subjects: [RECORDED_USAGE_SUBJECTS],
        retention: RetentionPolicy.Workqueue,
        storage: StorageType.File,
        max_age: nanos(RECORDED_USAGE_MAX_AGE_MS)
      })
      .catch((e) => {
        // Another replica created it at the same moment.
        if (!inUse(e)) throw e;
      });
  }
}

/**
 * Publishes one batch of unpublished usage, oldest first, each with its usage id as the message id
 * (JetStream drops a repeat), then marks the batch published. A crash between the two only
 * publishes the batch again. Returns how many were published.
 */
export async function publishRecordedUsageOnce(
  nc: NatsConnection,
  db: UsageSql,
  batch = 500
): Promise<number> {
  const rows = await db.$queryRawUnsafe<Row[]>(
    `SELECT id, owner_ref, workspace_ref, app_ref, call_ref, region, region_kind, origin, meter,
            quantity, provider, model, key_source, occurred_at
       FROM usage_events WHERE published_at IS NULL ORDER BY recorded_at, id LIMIT $1`,
    batch
  );
  if (!rows.length) return 0;
  const js = nc.jetstream();
  for (const row of rows)
    await js.publish(
      recordedUsageSubject(row.owner_ref),
      sc.encode(JSON.stringify(toRecorded(row))),
      { msgID: row.id }
    );
  await db.$executeRawUnsafe(
    `UPDATE usage_events SET published_at = now() WHERE id = ANY($1::varchar[])`,
    rows.map((r) => r.id)
  );
  return rows.length;
}

/**
 * Runs the billing outbox (only when billing is enabled): publishes stored usage until none is
 * left, then waits `intervalMs`. Errors are logged and retried. Returns a stop function.
 */
export async function runRecordedUsagePublisher(deps: {
  nc: NatsConnection;
  db: UsageSql;
  intervalMs?: number;
}): Promise<() => void> {
  await ensureRecordedUsageStream(deps.nc);
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = async () => {
    try {
      while (!stopped && (await publishRecordedUsageOnce(deps.nc, deps.db)));
    } catch (e) {
      logger.warn(
        `usage not published for billing yet: ${(e as Error).message}`
      );
    }
    if (!stopped) timer = setTimeout(tick, deps.intervalMs ?? 1000);
  };
  void tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
