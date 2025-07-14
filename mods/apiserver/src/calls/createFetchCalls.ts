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
  CALL_DETAIL_RECORD_MEASUREMENT,
  INFLUXDB_CALLS_BUCKET,
  InfluxDBClient
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  CallDetailRecord,
  ListCallsRequest,
  ListCallsResponse
} from "@fonoster/types";
import { flux } from "@influxdata/influxdb-client";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createFetchCalls(influxdb: InfluxDBClient) {
  return async (
    accessKeyId: string,
    request: ListCallsRequest
  ): Promise<ListCallsResponse> => {
    const { after, before, type, from, to, status, pageSize, pageToken } =
      request;

    const accessKeyIdFilter = accessKeyId
      ? flux`and r.accessKeyId == "${accessKeyId}"`
      : flux``;
    const typeFilter = type ? flux`and r.type == "${type}"` : flux``;
    const fromFilter = from ? flux`and r.from == "${from}"` : flux``;
    const toFilter = to ? flux`and r.to == "${to}"` : flux``;
    const statusFilter = status ? flux`and r.status == "${status}"` : flux``;
    const pageTokenFilter = pageToken
      ? flux`|> filter(fn: (r) => r.startedAtParsed < int(v: ${pageToken}))`
      : flux``;
    const limit = flux`|> limit(n: ${pageSize || 50})`;
    const parsedAfter = after
      ? Math.trunc(new Date(after).getTime() / 1000)
      : flux`-30d`;
    const parsedBefore = before
      ? new Date(before).getTime() / 1000
      : new Date().getTime() / 1000;

    const query = flux`from(bucket: "${INFLUXDB_CALLS_BUCKET}")
      |> range(start: ${parsedAfter})
      |> pivot(rowKey: ["callId"], columnKey: ["_field"], valueColumn: "_value")
      |> map(fn: (r) => ({
          r with
          duration: int(v: r.endedAt) - int(v: r.startedAt),
          startedAtParsed: int(v: r.startedAt) / 1000,
        }))
      |> filter(fn: (r) =>
        r._measurement == "${CALL_DETAIL_RECORD_MEASUREMENT}"
        and r.startedAtParsed < ${parsedBefore}
        ${accessKeyIdFilter}
        ${typeFilter}
        ${fromFilter}
        ${toFilter}
        ${statusFilter})
      |> group()
      |> sort(columns: ["startedAtParsed"], desc: true)
      ${pageTokenFilter}
      ${limit}`;

    logger.verbose("list calls request", {
      accessKeyId,
      after,
      before,
      query: query.toString()
    });

    const items = (await influxdb.collectRows(query)) as CallDetailRecord[];

    const nextPageToken =
      items.length > 0 ? items[items.length - 1].startedAt : "";

    return {
      nextPageToken: nextPageToken + "",
      items
    };
  };
}

export { createFetchCalls };
