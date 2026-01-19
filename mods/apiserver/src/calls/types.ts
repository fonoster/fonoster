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
import { DialStatus, GrpcErrorMessage } from "@fonoster/common";
import {
  CallDetailRecord,
  CallStatus,
  CallType,
  CreateCallRequest
} from "@fonoster/types";

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
  nextPageToken: string;
  items: CallDetailRecord[];
};

type GetCallRequest = {
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
  CallPublisher,
  CallStream,
  CreateCallRequest,
  GetCallRequest,
  ListCallsRequest,
  ListCallsResponse,
  TrackCallResponse,
  TrackCallSubscriber
};
