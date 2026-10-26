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
  /** Where the previous page ended: `<startedAt ms>:<callRef>` (a bare startedAt ms is read too). */
  pageToken?: string;
};

/** A page token: the last record's startedAt and callRef, so records that share a time are not skipped. */
function pageTokenOf(row: CallRecordRow) {
  return `${row.startedAt.getTime()}:${row.callRef}`;
}

/** The records after a page token, in the list's order (startedAt, then callRef, descending). */
function afterToken(pageToken: string): Record<string, unknown> {
  const sep = pageToken.indexOf(":");
  const at = new Date(Number(sep < 0 ? pageToken : pageToken.slice(0, sep)));
  // An older token (a bare startedAt) keeps its meaning: strictly before it.
  if (sep < 0) return { startedAt: { lt: at } };
  return {
    OR: [
      { startedAt: { lt: at } },
      { startedAt: at, callRef: { lt: pageToken.slice(sep + 1) } }
    ]
  };
}

/**
 * Searches the index within one workspace (call-record "Fetch and search": time range, number,
 * app, direction and status; records from other workspaces are never returned). Newest first.
 * With `total`, the first page (no page token) also counts every record the query matches, on
 * all pages (#1069); later pages don't count again.
 */
export function createSearchRecords(db: RecordsDb) {
  return async (
    accessKeyId: string,
    search: RecordSearch,
    options: { total?: boolean } = {}
  ) => {
    const startedAt: Record<string, Date> = {};
    if (search.after) startedAt.gte = new Date(search.after);
    if (search.before) startedAt.lt = new Date(search.before);
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
    // The page token only moves the page: the total counts the query without it.
    const pageWhere = search.pageToken
      ? { AND: [where, afterToken(search.pageToken)] }
      : where;
    const pageSize = Math.min(Math.max(search.pageSize || 50, 1), 500);
    const [items, total] = await Promise.all([
      db.callRecord.findMany({
        where: pageWhere,
        orderBy: [{ startedAt: "desc" }, { callRef: "desc" }],
        take: pageSize
      }),
      options.total && !search.pageToken
        ? db.callRecord.count({ where })
        : undefined
    ]);
    return {
      items,
      nextPageToken:
        items.length === pageSize ? pageTokenOf(items[items.length - 1]) : "",
      ...(total !== undefined ? { total } : {})
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
