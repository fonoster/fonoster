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

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** Writes points to the calls bucket (built by createCdrWriter). */
function createInfluxDbPub(config: InfluxDbPub) {
  const { url, token, org, bucket } = config;

  logger.info("creating influxdb client", { url, org, bucket });

  const client = new InfluxDB({ url, token });
  const writeClient = client.getWriteApi(org, bucket, "ns");

  return (point: Point) => {
    logger.verbose("writing event to InfluxDB", {
      line: point.toLineProtocol()
    });
    try {
      writeClient.writePoint(point);
      // flush() rejects when InfluxDB is unreachable; unhandled, that killed the process (ST-B8).
      writeClient
        .flush()
        .catch((error) =>
          logger.warn(`error writing to InfluxDB: ${error.message}`)
        );
    } catch (error) {
      logger.error("error writing to InfluxDB:", error);
    }
  };
}

export { InfluxDbPub, createInfluxDbPub };
