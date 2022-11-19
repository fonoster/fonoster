/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import grpc, { ServerWritableStream } from "@grpc/grpc-js";
import { Event, SearchEventsRequest } from "./protos/monitor_pb";
import {
  IMonitorServer,
  IMonitorService,
  MonitorService
} from "./protos/monitor_grpc_pb";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { Client } from "@elastic/elasticsearch";
import { ErrorCodes, FonosterError } from "@fonoster/errors";
import { getAccessKeyId } from "@fonoster/core";
import { Level } from "./level";
import { EventType } from "./event_type";

const host = process.env.LOGS_AGGREGRATOR_HOST;
const port = process.env.LOGS_AGGREGRATOR_PORT;

const client = new Client({
  node: `http://${host}:${port}`
});

// eslint-disable-next-line require-jsdoc
class MonitorServer implements IMonitorServer {
  [name: string]: grpc.UntypedHandleCall;

  // eslint-disable-next-line require-jsdoc
  async searchEvents(call: ServerWritableStream<SearchEventsRequest, Event>) {
    const accessKeyId = getAccessKeyId(call);
    // TODO:
    // Assert toJavaScript is valid
    const { body } = await client.search(
      {
        body: {
          query: call.request.getQuery().toJavaScript()
        }
      },
      {
        asStream: true
      }
    );

    body.setEncoding("utf8");

    const entries = (chunk) =>
      JSON.parse(chunk)
        .hits?.hits?.filter(
          (hit) => hit["_source"]?.accessKeyId === accessKeyId
        )
        .map((hit) => {
          const entry = new Event();
          entry.setRef(hit["_id"]);
          entry.setMessage(hit["_source"].message);
          entry.setTimestamp(hit["_source"]["@timestamp"]);
          entry.setBody(Struct.fromJavaScript(hit["_source"]?.body));
          entry.setEventType(EventType.fromString(hit["_source"]?.eventType));
          entry.setLevel(Level.fromString(hit["_source"]?.level));
          return entry;
        });

    let payload = "";

    body.on("data", async (chunk) => (payload += chunk));

    body.on(
      "error",
      (e: Error) => new FonosterError(e.message, ErrorCodes.UNKNOWN)
    );

    body.on("end", () => {
      entries(payload)?.forEach((e: Event) => call.write(e));
      call.end();
    });
  }
}

export { MonitorServer as default, IMonitorService, MonitorService };
