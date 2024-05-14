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
import { InfluxDB, Point } from "@influxdata/influxdb-client";

type InfluxDbPub = {
  url: string;
  token: string;
  org: string;
  bucket: string;
};

type FonosterEvent = {
  name: "cdr" | "error";
  tag: string;
  data: Record<string, string>;
};

function createInfluxDbPub(config: InfluxDbPub) {
  const { url, token, org, bucket } = config;

  const client = new InfluxDB({ url, token });
  const writeClient = client.getWriteApi(org, bucket, "ns");

  return (event: FonosterEvent) => {
    const point = new Point(event.name).tag("tag", event.tag);

    // FIXME: To not use loops
    // eslint-disable-next-line no-loops/no-loops, guard-for-in
    for (const key in event.data) {
      point.stringField(key, event.data[key]);
    }

    writeClient.writePoint(point);
    writeClient.flush();
  };
}

export { createInfluxDbPub, FonosterEvent, InfluxDbPub };
