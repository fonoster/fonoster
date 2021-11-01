/* eslint-disable @typescript-eslint/no-explicit-any */
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
import WebAPIClient from "@fonoster/common/dist/web_client";
import {WebClientOptions} from "@fonoster/common/dist/types";
import {
  IFuncsClient,
  DeployFuncRequest,
  GetFuncRequest,
  GetFuncResponse,
  DeleteFuncResponse,
  DeleteFuncRequest,
  ListFuncsRequest,
  ListFuncsResponse,
  GetFuncLogsRequest
} from "@fonoster/funcs/src/client/types";
import {
  DeployStream,
  LogsStream
} from "@fonoster/funcs/src/client/stream_wrappers";
import * as c from "./generated/api";

export default class Agents extends WebAPIClient implements IFuncsClient {
  constructor(options: WebClientOptions) {
    super(c, "FuncsApi", options);
  }

  async deployFunc(request: DeployFuncRequest): Promise<DeployStream> {
    return (await super.run("deployFunc", request)) as any;
  }

  async getFunc(request: GetFuncRequest): Promise<GetFuncResponse> {
    return (await super.run("getFunc", request)) as any;
  }

  async deleteFunc(request: DeleteFuncRequest): Promise<DeleteFuncResponse> {
    return (await super.run("deleteFunc", request)) as any;
  }

  async listFuncs(request: ListFuncsRequest): Promise<ListFuncsResponse> {
    return (await super.run("listFuncs", request)) as any;
  }

  async getFuncLogs(request: GetFuncLogsRequest): Promise<LogsStream> {
    return (await super.run("getFuncLogs", request)) as any;
  }
}
