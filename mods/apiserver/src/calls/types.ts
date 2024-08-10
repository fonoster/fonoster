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
import { DialStatus, GrpcErrorMessage } from "@fonoster/common";
import { CallDirection, CallStatus, CallType } from "@fonoster/types";
import { ParameterizedQuery } from "@influxdata/influxdb-client";

const CALL_DETAIL_RECORD_MEASUREMENT = "cdr";

type CallDetailRecord = {
  ref: string;
  callId: string;
  status: CallStatus;
  type: CallType;
  from: string;
  to: string;
  duration: number;
  direction: CallDirection;
  startedAt: number;
  endedAt: number;
};

type ListCallsRequest = {
  after?: string;
  before?: string;
  type?: CallType;
  status?: CallStatus;
  from?: string;
  to?: string;
  pageSize?: number;
  pageToken?: string;
};

type ListCallsResponse = {
  nextPageToken?: string;
  items: CallDetailRecord[];
};

type GetCallRequest = {
  ref: string;
};

type InfluxDBClient = {
  collectRows(query: ParameterizedQuery): Promise<unknown[]>;
};

// If appRef is not provided, we will use the application associated
// with the 'from' number
type CreateCallRequest = {
  from: string;
  to: string;
  appRef?: string;
};

type CreateCallResponse = {
  ref: string;
};

type CallPublisher = {
  publishCall: (
    event: CreateCallRequest & { ref: string; accessKeyId: string }
  ) => void;
};

type TrackCallResponse = {
  ref: string;
  status: DialStatus;
};

type CallStream = {
  write: (data: TrackCallResponse | GrpcErrorMessage) => void;
  end: () => void;
};

type TrackCallSubscriber = {
  events: {
    on: (event: string, cb: (data: TrackCallResponse | Error) => void) => void;
  };
};

export {
  CALL_DETAIL_RECORD_MEASUREMENT,
  CallDetailRecord,
  ListCallsRequest,
  ListCallsResponse,
  GetCallRequest,
  CallType,
  CallStatus,
  CallDirection,
  InfluxDBClient,
  CreateCallRequest,
  CreateCallResponse,
  CallPublisher,
  TrackCallResponse,
  CallStream,
  TrackCallSubscriber
};
