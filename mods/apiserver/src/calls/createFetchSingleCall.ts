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
import { CallDetailRecord } from "@fonoster/types";
import { flux } from "@influxdata/influxdb-client";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createFetchSingleCall(influxdb: InfluxDBClient) {
  return async (
    accessKeyId: string,
    ref: string
  ): Promise<CallDetailRecord> => {
    logger.verbose("fetch single call request", { accessKeyId, ref });

    // Resolve the call's callId from the points that do carry the "ref" tag,
    // then collect the record by callId.
    //
    // Filtering the record query on "ref" directly would drop any point
    // written without that tag, and the call-end event from Routr carries no
    // ref of its own: it is only tagged because createInfluxDbPub remembers
    // the ref from the start event, in memory. An apiserver restart between
    // the two events loses that, so the end point is written untagged and a
    // ref filter hides it -- the CDR keeps its start and never gains a status
    // or a duration. Pivoting on callId merges both points either way, and
    // repairs records already written that way. (#885)
    const callIdQuery = flux`from(bucket: "${INFLUXDB_CALLS_BUCKET}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "${CALL_DETAIL_RECORD_MEASUREMENT}" and r.ref == "${ref}")
      |> keep(columns: ["callId"])
      |> distinct(column: "callId")`;

    const callIdRows = (await influxdb.collectRows(callIdQuery)) as {
      callId?: string;
      _value?: string;
    }[];

    const callId = callIdRows
      .map((row) => row.callId ?? row._value)
      .find((value) => Boolean(value));

    if (!callId) {
      return null;
    }

    // "callId" is a tag too, so this still filters before pivot runs and only
    // touches the one call's series.
    const query = flux`from(bucket: "${INFLUXDB_CALLS_BUCKET}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "${CALL_DETAIL_RECORD_MEASUREMENT}" and r.callId == "${callId}")
      |> pivot(rowKey: ["callId"], columnKey: ["_field"], valueColumn: "_value")
      |> map(fn: (r) => ({
          r with
          duration: int(v: r.endedAt) - int(v: r.startedAt)
        }))
      |> filter(fn: (r) => r.accessKeyId == "${accessKeyId}")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)`;

    const items = (await influxdb.collectRows(query)) as CallDetailRecord[];

    return items.length > 0 ? items[0] : null;
  };
}

export { createFetchSingleCall };
