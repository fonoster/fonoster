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
  CallDetailRecord,
  CreateCallRequest,
  CreateCallResponse,
  GetCallRequest,
  ListCallsRequest,
  ListCallsResponse,
  TrackCallRequest
} from "../../generated/web/calls_pb";
import { ClientFunction, ServerStreamFunction } from "./common";

type CallsClient = {
  createCall: ClientFunction<CreateCallRequest, CreateCallResponse>;
  getCall: ClientFunction<GetCallRequest, CallDetailRecord>;
  listCalls: ClientFunction<ListCallsRequest, ListCallsResponse>;
  trackCall: ServerStreamFunction<TrackCallRequest, CallDetailRecord>;
};

export { CallsClient };
