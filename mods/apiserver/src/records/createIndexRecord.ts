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
import { RECORD_SEALED_SUBJECT } from "@fonoster/callrecord";
import { CALL_REF_ATTR, TRACEPARENT_HEADER, Usage } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { MsgHdrs, NatsConnection, StringCodec } from "nats";
import { consumeDurable } from "../core/durableConsumer";
import { apiserverTelemetry } from "../core/telemetry";
import { isPrivateRegionRef } from "../regions/types";
import { ingestUsageIn } from "../usage/ingestUsage";
import { UsageDb, UsageDirectory } from "../usage/types";
import { TrunkOfNumber } from "./createTrunkOfNumber";
import { RecordIndexEntry, RecordsDb } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/** Where a call's usage lines go: owners come from Identity's workspaces once attached. */
export type IndexUsageDeps = { directory: () => UsageDirectory | undefined };

/** The usage events of an index entry, attributed from the entry (design D1). */
export function usageEvents(entry: RecordIndexEntry, workspaceRef: string) {
  const origin = entry.origin === "browser_test" ? "browser_test" : "call";
  return (entry.usage ?? []).map((line) => ({
    ...line,
    id: Usage.usageId(entry.callRef, line as Usage.UsageLine),
    workspaceRef,
    ...(entry.appRef ? { appRef: entry.appRef } : {}),
    callRef: entry.callRef,
    region: entry.region,
    regionKind: isPrivateRegionRef(entry.region) ? "private" : "public",
    origin,
    occurredAt: new Date(entry.endedAt ?? entry.startedAt).toISOString()
  }));
}

/**
 * The trunk the call used, by name: the trunk of the workspace's Number on the call (the callee
 * of an inbound call, the caller of an outbound one). Undefined when unknown, e.g. for an internal
 * call or when Routr can't be reached or doesn't answer within `timeoutMs`; indexing never fails
 * or stalls for it (the entry must be acknowledged within the consumer's ack wait).
 */
async function trunkNameOf(
  entry: RecordIndexEntry,
  workspaceRef: string | null,
  trunkOf: TrunkOfNumber | undefined,
  timeoutMs: number
) {
  const number =
    entry.direction === "inbound"
      ? entry.to
      : entry.direction === "outbound"
        ? entry.from
        : undefined;
  if (!trunkOf || !workspaceRef || !number) return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      trunkOf(workspaceRef, number),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Routr did not answer in ${timeoutMs} ms`)),
          timeoutMs
        );
      })
    ]);
  } catch (e) {
    logger.warn(`no trunk for ${entry.callRef}: ${(e as Error).message ?? e}`);
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** How long indexing waits for a call's trunk before indexing it without one. */
export const TRUNK_LOOKUP_TIMEOUT_MS = 2_000;

/**
 * Upserts a record's index entry. Entries arrive at least once and possibly out of order, so a
 * lower version never overwrites a higher one. An erased record keeps its row, without numbers.
 * The call's usage lines are stored in the same transaction as the row (add-usage-metering D1).
 */
export function createIndexRecord(
  db: RecordsDb,
  usage?: IndexUsageDeps,
  trunkOf?: TrunkOfNumber,
  trunkTimeoutMs = TRUNK_LOOKUP_TIMEOUT_MS
) {
  return async (entry: RecordIndexEntry) => {
    const existing = await db.callRecord.findUnique({
      where: { callRef: entry.callRef }
    });
    if (existing && existing.version > entry.version) return false;
    // A record's workspace never changes: anyone can publish on NATS today, so an entry that
    // names another workspace for a known record is dropped, not applied (RV-B6).
    if (
      existing?.accessKeyId &&
      entry.workspaceRef &&
      entry.workspaceRef !== existing.accessKeyId
    ) {
      logger.warn(
        `index entry for ${entry.callRef} names another workspace; ignored`
      );
      return false;
    }
    const erased = entry.status === "erased";
    const accessKeyId = existing?.accessKeyId ?? entry.workspaceRef ?? null;
    // Resolved once, when the call is first indexed: later versions keep what was stored, a
    // null included, so a Number moved to another trunk since never renames the call's.
    const trunkName = existing
      ? (existing.trunkName ?? null)
      : erased
        ? null
        : ((await trunkNameOf(entry, accessKeyId, trunkOf, trunkTimeoutMs)) ??
          null);
    const data = {
      accessKeyId,
      appRef: erased ? (existing?.appRef ?? null) : entry.appRef,
      fromNumber: erased ? null : entry.from,
      toNumber: erased ? null : entry.to,
      direction: erased ? (existing?.direction ?? null) : entry.direction,
      status: entry.status,
      endReason: erased ? (existing?.endReason ?? null) : entry.endReason,
      failureReason: entry.failureReason,
      sipStatus: entry.sipStatus,
      amdStatus: erased ? null : (entry.amdStatus ?? null),
      trunkName,
      startedAt:
        erased && existing ? existing.startedAt : new Date(entry.startedAt),
      endedAt: erased
        ? (existing?.endedAt ?? null)
        : entry.endedAt
          ? new Date(entry.endedAt)
          : null,
      durationSeconds: erased
        ? (existing?.durationSeconds ?? 0)
        : entry.durationSeconds,
      region: entry.region,
      location: entry.location,
      version: entry.version,
      size: BigInt(entry.size),
      parts: entry.parts,
      erasedAt: erased ? new Date() : null
    };
    const upsert = {
      where: { callRef: entry.callRef },
      create: { callRef: entry.callRef, ...data },
      update: data
    };
    const directory = usage?.directory();
    const workspaceRef = data.accessKeyId;
    if (!erased && directory && workspaceRef && entry.usage?.length) {
      const events = usageEvents(entry, workspaceRef);
      await (db as RecordsDb & UsageDb).$transaction(async (tx) => {
        await (tx as unknown as RecordsDb).callRecord.upsert(upsert);
        await ingestUsageIn(tx, directory, events);
      });
      return true;
    }
    if (!erased && !directory && entry.usage?.length)
      logger.warn(
        `usage for ${entry.callRef} not stored: no workspace directory yet`
      );
    await db.callRecord.upsert(upsert);
    return true;
  };
}

/** The work queue that captures the AppBridge replicas' index entries and its durable consumer (ST-2). */
export const RECORD_INDEX_STREAM = "FONOSTER_RECORD_INDEX";
export const RECORD_INDEX_DURABLE = "apiserver-call-records";

/**
 * Consumes the AppBridge replicas' index entries (one apiserver replica per entry) through a JetStream
 * durable consumer: an entry is acknowledged once indexed, so one taken by a replica that dies is
 * indexed by another (indexing is an idempotent upsert). Without JetStream (or the permission),
 * a core NATS queue group, as before.
 */
export async function subscribeRecordIndex(
  nc: NatsConnection,
  db: RecordsDb,
  options: {
    ackWaitMs?: number;
    usage?: IndexUsageDeps;
    trunkOf?: TrunkOfNumber;
  } = {}
): Promise<() => Promise<void> | void> {
  const index = createIndexRecord(db, options.usage, options.trunkOf);
  const handle = async (data: Uint8Array, headers?: MsgHdrs) => {
    let entry: RecordIndexEntry;
    try {
      entry = JSON.parse(sc.decode(data));
    } catch {
      return;
    }
    // One span per entry, in AppBridge's trace when it sent a traceparent header.
    const telemetry = apiserverTelemetry();
    const span = telemetry.startSpan(
      "apiserver.records.index",
      { [CALL_REF_ATTR]: entry.callRef ?? "" },
      headers?.get(TRACEPARENT_HEADER) || undefined
    );
    try {
      const done = await index(entry);
      telemetry.count("fonoster.apiserver.records.indexed", 1, {
        outcome: done ? "indexed" : "skipped"
      });
      span.end();
    } catch (e) {
      telemetry.count("fonoster.apiserver.records.indexed", 1, {
        outcome: "error"
      });
      span.end(undefined, (e as Error).message);
      logger.error(`could not index ${entry.callRef}: ${(e as Error).message}`);
      throw e;
    }
  };
  try {
    return await consumeDurable(
      nc,
      {
        stream: RECORD_INDEX_STREAM,
        subject: RECORD_SEALED_SUBJECT,
        durable: RECORD_INDEX_DURABLE,
        ackWaitMs: options.ackWaitMs,
        maxDeliver: 20
      },
      handle
    );
  } catch (e) {
    logger.warn(
      `call records: JetStream consumer unavailable (${(e as Error).message}); falling back to a core NATS queue group`
    );
    const sub = nc.subscribe(RECORD_SEALED_SUBJECT, {
      queue: "apiserver-call-records",
      callback: (err, msg) => {
        if (err) return;
        handle(msg.data, msg.headers).catch(() => undefined);
      }
    });
    return () => sub.unsubscribe();
  }
}
