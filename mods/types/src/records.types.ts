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
/** A call record's index entry (add-call-record, /api/records). */
type CallRecordSummary = {
  callRef: string;
  appRef: string | null;
  from: string | null;
  to: string | null;
  direction: string | null;
  /** completed, failed, erased, ... */
  status: string;
  endReason: string | null;
  failureReason: string | null;
  sipStatus: number | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  region: string;
  version: number;
  size: number;
  parts: string[];
};

type ListCallRecordsRequest = {
  /** ISO time bounds on startedAt. */
  after?: string;
  before?: string;
  /** Matches the from or to number. */
  number?: string;
  appRef?: string;
  /** inbound, outbound or internal. */
  direction?: string;
  status?: string;
  pageSize?: number;
  pageToken?: string;
};

type ListCallRecordsResponse = {
  items: CallRecordSummary[];
  nextPageToken?: string;
};

/** One version of a record: the vCon (redacted unless `original`) and its signature. */
type CallRecordDetail = CallRecordSummary & {
  currentVersion: number;
  redacted: boolean;
  vcon: Record<string, unknown>;
  jws: unknown;
};

type CallRecordAuditEntry = {
  action: string;
  part: string;
  reason: string;
  actor: string;
  version: number;
  at: string;
};

type RetentionPolicy = { part: string; days: number | null };

export {
  CallRecordAuditEntry,
  CallRecordDetail,
  CallRecordSummary,
  ListCallRecordsRequest,
  ListCallRecordsResponse,
  RetentionPolicy
};
