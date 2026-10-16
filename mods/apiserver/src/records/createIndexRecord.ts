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
import { CALL_REF_ATTR, TRACEPARENT_HEADER } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { NatsConnection, StringCodec } from "nats";
import { apiserverTelemetry } from "../core/telemetry";
import { RecordIndexEntry, RecordsDb } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/**
 * Upserts a record's index entry. Entries arrive at least once and possibly out of order, so a
 * lower version never overwrites a higher one. An erased record keeps its row, without numbers.
 */
export function createIndexRecord(db: RecordsDb) {
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
    const data = {
      accessKeyId: existing?.accessKeyId ?? entry.workspaceRef ?? null,
      appRef: erased ? (existing?.appRef ?? null) : entry.appRef,
      fromNumber: erased ? null : entry.from,
      toNumber: erased ? null : entry.to,
      direction: erased ? (existing?.direction ?? null) : entry.direction,
      status: entry.status,
      endReason: erased ? (existing?.endReason ?? null) : entry.endReason,
      failureReason: entry.failureReason,
      sipStatus: entry.sipStatus,
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
    await db.callRecord.upsert({
      where: { callRef: entry.callRef },
      create: { callRef: entry.callRef, ...data },
      update: data
    });
    return true;
  };
}

/** Consumes the gateways' index entries (one apiserver replica per entry). */
export function subscribeRecordIndex(nc: NatsConnection, db: RecordsDb) {
  const index = createIndexRecord(db);
  const sub = nc.subscribe(RECORD_SEALED_SUBJECT, {
    queue: "apiserver-call-records",
    callback: (err, msg) => {
      if (err) return;
      let entry: RecordIndexEntry;
      try {
        entry = JSON.parse(sc.decode(msg.data));
      } catch {
        return;
      }
      // One span per entry, in the gateway's trace when it sent a traceparent header.
      const telemetry = apiserverTelemetry();
      const span = telemetry.startSpan(
        "apiserver.records.index",
        { [CALL_REF_ATTR]: entry.callRef ?? "" },
        msg.headers?.get(TRACEPARENT_HEADER) || undefined
      );
      index(entry)
        .then((done) => {
          telemetry.count("fonoster.apiserver.records.indexed", 1, {
            outcome: done ? "indexed" : "skipped"
          });
          span.end();
        })
        .catch((e) => {
          telemetry.count("fonoster.apiserver.records.indexed", 1, {
            outcome: "error"
          });
          span.end(undefined, e.message);
          logger.error(`could not index ${entry.callRef}: ${e.message}`);
        });
    }
  });
  return () => sub.unsubscribe();
}
