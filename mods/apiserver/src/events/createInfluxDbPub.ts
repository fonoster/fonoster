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
import { getLogger } from "@fonoster/logger";
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

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createInfluxDbPub(config) {
  const { url, token, org, bucket } = config;

  logger.info("creating influxdb client", { url, org, bucket });

  const client = new InfluxDB({ url, token });
  const writeClient = client.getWriteApi(org, bucket, "ns");

  return (event) => {
    logger.verbose("writing event to InfluxDB", event);
    const point = new Point(event.name).tag("callId", event.tag);

    Object.entries(event.data).forEach(([key, value]) => {
      if (typeof value === "number") {
        point.intField(key, value); // Or floatField for floating-point numbers
      } else if (typeof value === "boolean") {
        point.booleanField(key, value);
      } else if (key === "startedAt" || key === "endedAt") {
        point.stringField(key, new Date(value.toString()).getTime());
      } else {
        point.stringField(key, value);
      }
    });

    try {
      writeClient.writePoint(point);
      writeClient.flush();
    } catch (error) {
      logger.error("error writing to InfluxDB:", error);
    }
  };
}

export { FonosterEvent, InfluxDbPub, createInfluxDbPub };
