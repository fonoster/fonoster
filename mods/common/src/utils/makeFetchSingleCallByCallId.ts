/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { flux } from "@influxdata/influxdb-client";
import {
  CALL_DETAIL_RECORD_MEASUREMENT,
  INFLUXDB_CALLS_BUCKET
} from "../constants";
import { CallDetailRecord } from "@fonoster/types";
import { InfluxDBClient } from "./types";

function makeFetchSingleCallByCallId(influxdb: InfluxDBClient) {
  return async (callId: string): Promise<CallDetailRecord> => {
    const query = flux`from(bucket: "${INFLUXDB_CALLS_BUCKET}")
      |> range(start: -365d)
      |> pivot(rowKey: ["callId"], columnKey: ["_field"], valueColumn: "_value")
      |> map(fn: (r) => ({
          r with
          duration: int(v: r.endedAt) - int(v: r.startedAt)
        }))
      |> filter(fn: (r) => r._measurement == "${CALL_DETAIL_RECORD_MEASUREMENT}")
      |> filter(fn: (r) => r.callId == ${callId})
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)`;

    const items = (await influxdb.collectRows(query)) as CallDetailRecord[];

    return items.length > 0 ? items[0] : null;
  };
}

export { makeFetchSingleCallByCallId };
