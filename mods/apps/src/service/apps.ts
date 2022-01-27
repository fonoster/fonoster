/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
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
import grpc, {ServerWritableStream} from "@grpc/grpc-js";
import {IAppsServer} from "./protos/apps_grpc_pb";
import {
  GetAppRequest,
  App,
  DeleteAppRequest,
  ListAppsResponse,
  ListAppsRequest,
  CreateAppRequest,
  UpdateAppRequest
} from "./protos/apps_pb";
import {Empty} from "./protos/common_pb";

export default class AppsServer implements IAppsServer {
  createApp: grpc.handleUnaryCall<CreateAppRequest, App>;
  updateApp: grpc.handleUnaryCall<UpdateAppRequest, App>;
  [name: string]: grpc.UntypedHandleCall;
  listApps: grpc.handleUnaryCall<ListAppsRequest, ListAppsResponse>;
  getApp: grpc.handleUnaryCall<GetAppRequest, App>;
  deleteApp: grpc.handleUnaryCall<DeleteAppRequest, Empty>;
}
