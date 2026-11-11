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
import type { AuditEntry, RecordIndexEntry } from "@fonoster/callrecord";

// add-call-record: the control plane's side of call records. The index (one row per record),
// the audit log of deletions and the per-workspace retention policies live in the apiserver's
// database ("// rebuild: records" in schema.prisma); contents stay in region object storage.

export type CallRecordRow = {
  callRef: string;
  accessKeyId: string | null;
  appRef: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  direction: string | null;
  status: string;
  endReason: string | null;
  failureReason: string | null;
  sipStatus: number | null;
  /** Who answered, by AMD (human, voicemail, ivr, machine, unknown); null when it didn't run. */
  amdStatus?: string | null;
  /** The trunk of the workspace's number on the call, by name; null when unknown. */
  trunkName?: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number;
  region: string;
  location: string;
  version: number;
  size: bigint | number;
  parts: string[];
  erasedAt: Date | null;
};

export type RetentionRow = {
  accessKeyId: string;
  part: string;
  days: number;
};

export type AuditRow = {
  callRef: string;
  accessKeyId: string | null;
  action: string;
  part: string;
  reason: string;
  actor: string;
  version: number;
  at: Date;
};

/**
 * The slice of the Prisma client these functions use. Typed here, not from the generated client,
 * so the records code compiles before the client is regenerated with the new models.
 */
export interface RecordsDb {
  callRecord: {
    findUnique(args: {
      where: { callRef: string };
    }): Promise<CallRecordRow | null>;
    findMany(args: Record<string, unknown>): Promise<CallRecordRow[]>;
    count(args: Record<string, unknown>): Promise<number>;
    upsert(args: Record<string, unknown>): Promise<unknown>;
    update(args: Record<string, unknown>): Promise<unknown>;
  };
  callRecordAudit: {
    createMany(args: { data: AuditRow[] }): Promise<unknown>;
    findMany(args: Record<string, unknown>): Promise<AuditRow[]>;
  };
  callRecordRetention: {
    findMany(args?: Record<string, unknown>): Promise<RetentionRow[]>;
    upsert(args: Record<string, unknown>): Promise<unknown>;
    deleteMany(args: Record<string, unknown>): Promise<unknown>;
  };
}

type DeleteByWorkspace = {
  deleteMany(args: {
    where: { accessKeyId: string };
  }): Promise<{ count: number }>;
};

/**
 * What the erasure of deleted workspaces uses of the Prisma client (#1321): the records' slice,
 * and the tables that hold a workspace's applications, secrets and webhooks.
 */
export type WorkspaceErasureDb = RecordsDb & {
  /** Their tts_services, stt_services and intelligence_services rows cascade. */
  application: DeleteByWorkspace;
  /** Their workspace_provider_keys rows cascade. */
  secret: DeleteByWorkspace;
  webhookEndpoint: DeleteByWorkspace;
  webhookDelivery: DeleteByWorkspace;
};

/** A workspace's numbers and trunks in Routr, for the erasure of deleted workspaces (#1321). */
export type WorkspaceSipResources = {
  /** The refs of the numbers whose `extended.accessKeyId` is the workspace's. */
  numbers(accessKeyId: string): Promise<string[]>;
  /** The refs of the trunks whose `extended.accessKeyId` is the workspace's. */
  trunks(accessKeyId: string): Promise<string[]>;
  /** Resolves when the number is deleted, or was already gone. */
  deleteNumber(ref: string): Promise<void>;
  /** Resolves when the trunk is deleted, or was already gone. */
  deleteTrunk(ref: string): Promise<void>;
};

/** Sends retention and erasure requests to the region that holds the record. */
export type MaintenanceClient = (
  region: string,
  request: {
    op: "delete_parts" | "erase";
    callRef: string;
    workspaceRef?: string | null;
    /** Where the record is stored (the index's location): the region store or a workspace bucket. */
    location?: string;
    parts?: string[];
    reason: string;
    actor: string;
  }
) => Promise<
  | { type: "ack"; version: number; audit: AuditEntry[] }
  | { type: "error"; code: string; message?: string }
>;

export type { AuditEntry, RecordIndexEntry };
