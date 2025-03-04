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
import { InfluxDBClient } from "@fonoster/common";
import { connect } from "nats";
import { prisma } from "../core/db";
import { NATS_URL } from "../envs";
import { createCall } from "./createCall";
import { createCallPublisher } from "./createCallPublisher";
import { createTrackCall } from "./createTrackCall";
import { getCall } from "./getCall";
import { listCalls } from "./listCalls";

async function buildService(influxdb: InfluxDBClient) {
  const callPublisher = await createCallPublisher(NATS_URL);
  const nc = await connect({ servers: NATS_URL, maxReconnectAttempts: -1 });

  return {
    definition: {
      serviceName: "Calls",
      pckg: "calls",
      version: "v1beta2",
      proto: "calls.proto"
    },
    handlers: {
      createCall: createCall(prisma, callPublisher),
      listCalls: listCalls(influxdb),
      getCall: getCall(influxdb),
      trackCall: createTrackCall(nc)
    }
  };
}

export { buildService };
