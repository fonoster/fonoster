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
  CallDetailRecord,
  CallDirection,
  CallStatus,
  CallType,
  ListCallsRequest,
  ListCallsResponse
} from "@fonoster/types";
import { failureStatus } from "./failureStatus";
import { CallRecordRow, RecordsDb } from "./types";

export type RecordSearch = {
  after?: string;
  before?: string;
  /** Matches the caller or the callee. */
  number?: string;
  from?: string;
  to?: string;
  appRef?: string;
  /** inbound, outbound or internal. */
  direction?: string;
  status?: string;
  pageSize?: number;
  /** The previous page's last startedAt (ms). */
  pageToken?: string;
};

/**
 * Searches the index within one workspace (call-record "Fetch and search": time range, number,
 * app, direction and status; records from other workspaces are never returned). Newest first.
 */
export function createSearchRecords(db: RecordsDb) {
  return async (accessKeyId: string, search: RecordSearch) => {
    const startedAt: Record<string, Date> = {};
    if (search.after) startedAt.gte = new Date(search.after);
    if (search.before) startedAt.lt = new Date(search.before);
    if (search.pageToken) {
      const token = new Date(Number(search.pageToken));
      if (!startedAt.lt || token < startedAt.lt) startedAt.lt = token;
    }
    const where: Record<string, unknown> = {
      accessKeyId,
      erasedAt: null,
      ...(Object.keys(startedAt).length ? { startedAt } : {}),
      ...(search.from ? { fromNumber: search.from } : {}),
      ...(search.to ? { toNumber: search.to } : {}),
      ...(search.appRef ? { appRef: search.appRef } : {}),
      ...(search.direction ? { direction: search.direction } : {}),
      ...(search.status ? { status: search.status } : {}),
      ...(search.number
        ? {
            OR: [{ fromNumber: search.number }, { toNumber: search.number }]
          }
        : {})
    };
    const pageSize = Math.min(Math.max(search.pageSize || 50, 1), 500);
    const items = await db.callRecord.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: pageSize
    });
    return {
      items,
      nextPageToken:
        items.length === pageSize
          ? String(items[items.length - 1].startedAt.getTime())
          : ""
    };
  };
}

/** A call detail record (the existing Calls API shape) from an index row. */
export function toCallDetailRecord(row: CallRecordRow): CallDetailRecord {
  const status =
    row.status === "failed"
      ? failureStatus(row.failureReason)
      : CallStatus.NORMAL_CLEARING;
  // The Calls API carries times as epoch seconds (int32 on the wire; the SDK multiplies by 1000).
  return {
    ref: row.callRef,
    accessKeyId: row.accessKeyId ?? "",
    callId: row.callRef,
    direction:
      row.direction === "outbound"
        ? CallDirection.TO_PSTN
        : CallDirection.FROM_PSTN,
    type:
      row.direction === "outbound"
        ? CallType.API_ORIGINATED
        : CallType.SIP_ORIGINATED,
    status,
    startedAt: Math.floor(row.startedAt.getTime() / 1000),
    endedAt: Math.floor((row.endedAt ?? row.startedAt).getTime() / 1000),
    from: row.fromNumber ?? "",
    to: row.toNumber ?? "",
    duration: row.durationSeconds,
    appRef: row.appRef ?? "",
    // AmdStatus enum names are the index's words in capitals.
    ...(row.amdStatus ? { amdStatus: row.amdStatus.toUpperCase() } : {})
  } as unknown as CallDetailRecord;
}

const STATUS_FILTER: Partial<
  Record<CallStatus, { status: string; failureReason?: string }>
> = {
  [CallStatus.NORMAL_CLEARING]: { status: "completed" },
  [CallStatus.USER_BUSY]: { status: "failed", failureReason: "busy" },
  [CallStatus.NO_ANSWER]: { status: "failed", failureReason: "no_answer" }
};

/**
 * ListCalls served from the call-record index (task 7.1).
 */
export function createFetchCallsFromIndex(db: RecordsDb) {
  const search = createSearchRecords(db);
  return async (
    accessKeyId: string,
    request: ListCallsRequest
  ): Promise<ListCallsResponse> => {
    const status = request.status
      ? STATUS_FILTER[request.status as CallStatus]
      : undefined;
    const result = await search(accessKeyId, {
      after: request.after,
      before: request.before,
      from: request.from,
      to: request.to,
      appRef: request.appRef,
      status: status?.status,
      pageSize: request.pageSize,
      pageToken: request.pageToken
    });
    let items = result.items;
    if (status?.failureReason)
      items = items.filter((r) => r.failureReason === status.failureReason);
    if (request.type)
      items = items.filter(
        (r) =>
          (r.direction === "outbound"
            ? CallType.API_ORIGINATED
            : CallType.SIP_ORIGINATED) === request.type
      );
    return {
      nextPageToken: result.nextPageToken,
      items: items.map(toCallDetailRecord)
    };
  };
}

/** GetCall from the index. */
export function createFetchSingleCallFromIndex(db: RecordsDb) {
  return async (accessKeyId: string, ref: string) => {
    const row = await db.callRecord.findUnique({ where: { callRef: ref } });
    if (!row || row.accessKeyId !== accessKeyId || row.erasedAt) return null;
    return toCallDetailRecord(row);
  };
}
