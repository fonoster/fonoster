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
  CallDetailRecord,
  InfluxDBClient
} from "./types";
import { INFLUXDB_BUCKET } from "../core/envs";

function createFetchSingleCall(influxdb: InfluxDBClient) {
  return async (
    accessKeyId: string,
    ref: string
  ): Promise<CallDetailRecord> => {
    // TODO: Look into best practices for range and limit
    const query = flux`from(bucket: "${INFLUXDB_BUCKET}")
      |> range(start: -360d)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> filter(fn: (r) => r._measurement == "${CALL_DETAIL_RECORD_MEASUREMENT}")
      |> filter(fn: (r) => r.ref == ${ref} and r.accessKeyId == "${accessKeyId}")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1)`;

    const items = (await influxdb.collectRows(query)) as CallDetailRecord[];

    return items.length > 0 ? items[0] : null;
  };
}

export { createFetchSingleCall };
