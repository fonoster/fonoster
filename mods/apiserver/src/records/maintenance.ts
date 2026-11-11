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
import { PRIVATE_REGION_PREFIX, WorkspaceDirectory } from "../regions/types";
import {
  AuditEntry,
  MaintenanceClient,
  RecordsDb,
  WorkspaceErasureDb,
  WorkspaceSipResources
} from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

/**
 * Retention and erasure run in the record's region (it holds the files and the signing key);
 * the control plane asks over NATS (`callrecord.<region>.maintenance`, served by the AppBridge replicas).
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

/** Days a deleted workspace's call records are kept before they are erased (#1318). */
export const WORKSPACE_ERASURE_GRACE_DAYS = 30;

/**
 * Deletes what a deleted workspace left outside its call records (#1321): its applications (their
 * vendor credentials cascade), webhook endpoints and deliveries, and secrets (its provider keys
 * cascade) in this database, then its numbers and its trunks in Routr. In that order, stopping at
 * the first failure, so its secrets never go while an application remains, nor its trunks before
 * its numbers. Every delete is safe to repeat: the next run finishes what this one couldn't.
 */
async function deleteWorkspaceData(
  db: WorkspaceErasureDb,
  sip: WorkspaceSipResources,
  accessKeyId: string
) {
  try {
    const where = { accessKeyId };
    const applications = await db.application.deleteMany({ where });
    const webhookEndpoints = await db.webhookEndpoint.deleteMany({ where });
    const webhookDeliveries = await db.webhookDelivery.deleteMany({ where });
    const secrets = await db.secret.deleteMany({ where });
    const numbers = await sip.numbers(accessKeyId);
    for (const ref of numbers) await sip.deleteNumber(ref);
    const trunks = await sip.trunks(accessKeyId);
    for (const ref of trunks) await sip.deleteTrunk(ref);
    const removed = {
      applications: applications.count,
      webhookEndpoints: webhookEndpoints.count,
      webhookDeliveries: webhookDeliveries.count,
      secrets: secrets.count,
      numbers: numbers.length,
      trunks: trunks.length
    };
    // Every run comes back here for every deleted workspace; most find nothing left.
    if (Object.values(removed).some((count) => count > 0))
      logger.info(`deleted the data of deleted workspace ${accessKeyId}`, {
        removed
      });
  } catch (e) {
    logger.warn(
      `deleting the data of deleted workspace ${accessKeyId} failed: ${(e as Error).message}`
    );
  }
}

/**
 * Acts on Identity's deletion records. First, for every deleted workspace and with no grace, it
 * deletes the workspace's applications, secrets, webhooks, numbers and trunks (#1321). Then it
 * erases the call records of workspaces deleted more than 30 days ago (#1318). Only a deletion
 * record starts either, never a workspace merely missing from the directory, and a workspace
 * whose key exists again (an operator restore) keeps everything. Records in a private region
 * stay. A workspace or a record that fails is retried on the next run; a failing directory ends
 * the run.
 */
export async function runWorkspaceErasure(
  db: WorkspaceErasureDb,
  maintenance: MaintenanceClient,
  directory: WorkspaceDirectory | undefined,
  now = new Date(),
  sip: WorkspaceSipResources
) {
  const done: string[] = [];
  if (!directory) return done;
  const maintain = createRecordMaintenance(db, maintenance);
  const cutoff =
    now.getTime() - WORKSPACE_ERASURE_GRACE_DAYS * 24 * 3600 * 1000;
  try {
    const deletions = await directory.deleted();
    // Before any record: a slow or failing region below can't hold these deletes back.
    for (const { accessKeyId } of deletions) {
      if (await directory.workspace(accessKeyId)) continue;
      await deleteWorkspaceData(db, sip, accessKeyId);
    }
    for (const { accessKeyId, deletedAt } of deletions) {
      if (deletedAt.getTime() >= cutoff) continue;
      // Right before its records: the workspace may have been recreated with the same key.
      if (await directory.workspace(accessKeyId)) continue;
      const rows = await db.callRecord.findMany({
        where: {
          accessKeyId,
          erasedAt: null,
          NOT: { region: { startsWith: PRIVATE_REGION_PREFIX } }
        },
        take: 500
      });
      for (const row of rows) {
        try {
          await maintain({
            op: "erase",
            callRef: row.callRef,
            accessKeyId,
            reason: "workspace deleted",
            actor: "system:workspace-deleted"
          });
          done.push(row.callRef);
        } catch (e) {
          if ((e as RecordMaintenanceError).code === "gone") continue;
          logger.warn(
            `erasing ${row.callRef} of deleted workspace ${accessKeyId} failed: ${(e as Error).message}`
          );
        }
      }
    }
  } catch (e) {
    logger.warn(
      `workspace erasure stopped: could not read Identity's workspaces: ${(e as Error).message}`
    );
  }
  return done;
}
