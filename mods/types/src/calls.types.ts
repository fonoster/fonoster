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
import { BaseApiObject, ListResponse } from "./common";

enum CallType {
  SIP_ORIGINATED = "SIP_ORIGINATED",
  API_ORIGINATED = "API_ORIGINATED"
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
  FROM_PSTN = "FROM_PSTN",
  TO_PSTN = "TO_PSTN",
  INTRA_NETWORK = "INTRA_NETWORK"
}

type CallDetailRecord = {
  ref: string;
  accessKeyId: string;
  status: CallStatus;
  type: CallType;
  from: string;
  to: string;
  duration: number;
  direction: CallDirection;
  startedAt: Date;
  endedAt: Date;
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

type ListCallsResponse = ListResponse<CallDetailRecord>;

// If appRef is not provided, we will use the application associated
// with the 'from' number
type CreateCallRequest = {
  from: string;
  to: string;
  appRef?: string;
  timeout?: number;
};

type CallPublisher = {
  publishCall: (event: CreateCallRequest & BaseApiObject) => void;
};

type TrackCallResponse = {
  ref: string;
  status: CallStatus;
};

type TrackCallSubscriber = {
  events: {
    on: (event: string, cb: (data: TrackCallResponse | Error) => void) => void;
  };
};

export {
  CallDetailRecord,
  CallDirection,
  CallPublisher,
  CallStatus,
  CallType,
  CreateCallRequest,
  ListCallsRequest,
  ListCallsResponse,
  TrackCallResponse,
  TrackCallSubscriber
};
