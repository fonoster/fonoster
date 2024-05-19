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
import { ParameterizedQuery } from "@influxdata/influxdb-client";

const CALL_DETAIL_RECORD_MEASUREMENT = "cdr";

enum CallType {
  PROGRAMMABLE = "PROGRAMMABLE",
  SIP_TRUNKING = "SIP_TRUNKING"
}

enum CallStatus {
  NORMAL_CLEARING = "NORMAL_CLEARING",
  CALL_REJECTED = "CALL_REJECTED",
  UNALLOCATED = "UNALLOCATED",
  NO_USER_RESPONSE = "NO_USER_RESPONSE",
  NO_ROUTE_DESTINATION = "NO_ROUTE_DESTINATION",
  NO_ANSWER = "NO_ANSWER",
  USER_BUSY = "USER_BUSY",
  NOT_ACCEPTABLE_HERE = "NOT_ACCEPTABLE_HERE",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  INVALID_NUMBER_FORMAT = "INVALID_NUMBER_FORMAT"
}

enum CallDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND"
}

type CallDetailRecord = {
  ref: string;
  type: CallType;
  status: CallStatus;
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

type CreateCallRequest = {
  from: string;
  to: string;
  appUrl: string;
};

type CreateCallResponse = {
  ref: string;
};

type CallPublisher = {
  publishCall: (event: CreateCallRequest & { ref: string }) => void;
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
  CallPublisher
};
