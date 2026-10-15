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
import { RECORD_PARTS } from "@fonoster/callrecord";
import { getLogger } from "@fonoster/logger";
import { NatsConnection, StringCodec } from "nats";
import { AuditEntry, MaintenanceClient, RecordsDb } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/**
 * Retention and erasure run in the record's region (it holds the files and the signing key);
 * the control plane asks over NATS (`callrecord.<region>.maintenance`, served by the gateways).
 */
export function natsMaintenanceClient(
  nc: NatsConnection,
  timeoutMs = 30_000
): MaintenanceClient {
  return async (region, request) => {
    const msg = await nc.request(
      `callrecord.${region}.maintenance`,
      sc.encode(JSON.stringify(request)),
      { timeout: timeoutMs }
    );
    return JSON.parse(sc.decode(msg.data));
  };
}

/** Writes audit entries (call-record: what was deleted, when, why and by whom). */
export async function writeAudit(db: RecordsDb, audit: AuditEntry[]) {
  if (!audit.length) return;
  await db.callRecordAudit.createMany({
    data: audit.map((a) => ({
      callRef: a.callRef,
      accessKeyId: a.workspaceRef,
      action: a.action,
      part: a.part,
      reason: a.reason,
      actor: a.actor,
      version: a.version,
      at: new Date(a.at)
    }))
  });
}

export class RecordMaintenanceError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

/** Deletes parts of a record or erases it, then audits and updates the index. */
export function createRecordMaintenance(
  db: RecordsDb,
  maintenance: MaintenanceClient
) {
  return async (request: {
    op: "delete_parts" | "erase";
    callRef: string;
    accessKeyId: string;
    parts?: string[];
    reason: string;
    actor: string;
  }) => {
    const row = await db.callRecord.findUnique({
      where: { callRef: request.callRef }
    });
    if (!row || row.accessKeyId !== request.accessKeyId)
      throw new RecordMaintenanceError("not_found", "record not found");
    if (row.erasedAt)
      throw new RecordMaintenanceError("gone", "the record was erased");
    const parts = (request.parts ?? []).filter((p) =>
      (RECORD_PARTS as readonly string[]).includes(p)
    );
    if (request.op === "delete_parts" && !parts.length)
      throw new RecordMaintenanceError(
        "bad_request",
        `parts must be some of ${RECORD_PARTS.join(", ")}`
      );
    const reply = await maintenance(row.region, {
      op: request.op,
      callRef: request.callRef,
      workspaceRef: request.accessKeyId,
      location: row.location,
      parts,
      reason: request.reason,
      actor: request.actor
    });
    if (reply.type !== "ack")
      throw new RecordMaintenanceError(
        reply.code,
        reply.message ?? `${request.op} failed`
      );
    await writeAudit(db, reply.audit);
    // The region also publishes the new version's index entry; this makes the change visible
    // at once (and is harmless when that entry arrives).
    await db.callRecord.update({
      where: { callRef: request.callRef },
      data:
        request.op === "erase"
          ? {
              version: reply.version,
              status: "erased",
              erasedAt: new Date(),
              fromNumber: null,
              toNumber: null,
              parts: []
            }
          : {
              version: reply.version,
              // The region may delete more than asked (the transcript takes the messages).
              parts: row.parts.filter(
                (p) =>
                  !parts.includes(p) &&
                  !reply.audit.some((a: AuditEntry) => a.part === p)
              )
            }
    });
    logger.info(`call record ${request.callRef}: ${request.op} done`, {
      actor: request.actor
    });
    return { version: reply.version, audit: reply.audit };
  };
}

/**
 * Applies every workspace's retention policies once (task 4.3): records older than a policy's
 * days lose that part, with the policy named as the reason. Without a policy nothing is deleted.
 */
export async function runRetention(
  db: RecordsDb,
  maintenance: MaintenanceClient,
  now = Date.now()
) {
  const maintain = createRecordMaintenance(db, maintenance);
  const done: { callRef: string; part: string }[] = [];
  for (const policy of await db.callRecordRetention.findMany()) {
    const cutoff = new Date(now - policy.days * 24 * 3600 * 1000);
    const rows = await db.callRecord.findMany({
      where: {
        accessKeyId: policy.accessKeyId,
        erasedAt: null,
        startedAt: { lt: cutoff },
        parts: { has: policy.part }
      },
      take: 500
    });
    for (const row of rows) {
      try {
        await maintain({
          op: "delete_parts",
          callRef: row.callRef,
          accessKeyId: policy.accessKeyId,
          parts: [policy.part],
          reason: `retention policy: ${policy.part} after ${policy.days} days`,
          actor: "system:retention"
        });
        done.push({ callRef: row.callRef, part: policy.part });
      } catch (e) {
        logger.warn(
          `retention for ${row.callRef} failed: ${(e as Error).message}`
        );
      }
    }
  }
  return done;
}
