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
import { APIClient, ClientOptions } from "@fonoster/common";
import { MonitorClient } from "../service/protos/monitor_grpc_pb";
import MonitorPB from "../service/protos/monitor_pb";
import { promisifyAll } from "grpc-promise";
import {
  IMonitorClient,
  SearchEventsRequest,
  SearchEventsResponse
} from "./types";
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { Level } from "../service/level";
import { EventType } from "../service/event_type";

/**
 * @classdesc Use Fonoster Monitor, a capability of Fonoster to obtain user events.
 * The Monitor API requires of a running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/monitor")
 * const monitor = new Fonoster.Monitor()
 *
 * const request = {
 *   query: {}
 * }
 *
 * monitor.searchEvents(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Monitor extends APIClient implements IMonitorClient {
  /**
   * Constructs a new Monitor API object.
   *
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(MonitorClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Search for User events.
   *
   * @param {SearchEventsRequest} request - Request for obtain user events
   * @param {object} request.query - Friendly name for the SIP device
   * @return {Promise<SearchEventsResponse>}
   * @example
   *
   * const request = {
   *   query: {}
   * }
   *
   * monitor.searchEvents(request)
   * .then(result => {
   *   console.log(result)             // successful response
   * }).catch(e => console.error(e))   // an error occurred
   */
  async searchEvents(
    request: SearchEventsRequest
  ): Promise<SearchEventsResponse> {
    const req = new MonitorPB.SearchEventsRequest();
    req.setQuery(Struct.fromJavaScript(request.query));
    const result = await super
      .getService()
      .searchEvents()
      .sendMessage(req, super.getMeta());

    return {
      nextPageToken: null,
      events: result.map((e) => {
        return {
          ref: e.getRef(),
          level: Level.toString(e.getLevel()),
          eventType: EventType.toString(e.getEventType()),
          message: e.getMessage(),
          timestamp: new Date(e.getTimestamp()),
          body: e.getBody().toJavaScript()
        };
      })
    };
  }
}

export { MonitorPB, IMonitorClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Monitor;
module.exports.MonitorPB = MonitorPB;
