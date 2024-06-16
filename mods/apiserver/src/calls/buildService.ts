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
import { createCall } from "./createCall";
import { createCallPublisher } from "./createCallPublisher";
import { createTrackCallSubscriber } from "./createTrackCallSubscriber";
import { getCall } from "./getCall";
import { listCalls } from "./listCalls";
import { trackCall } from "./trackCall";
import { InfluxDBClient } from "./types";
import { NATS_URL } from "../core/envs";

async function buildService(influxdb: InfluxDBClient) {
  const trackCallSubscriber = await createTrackCallSubscriber(NATS_URL);
  const callPublisher = await createCallPublisher(NATS_URL);

  return {
    definition: {
      serviceName: "Calls",
      pckg: "calls",
      version: "v1beta2",
      proto: "calls.proto"
    },
    handlers: {
      createCall: createCall(callPublisher),
      listCalls: listCalls(influxdb),
      getCall: getCall(influxdb),
      trackCall: trackCall(trackCallSubscriber())
    }
  };
}

export { buildService };
