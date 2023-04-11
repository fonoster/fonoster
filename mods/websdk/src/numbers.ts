/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import * as c from "./generated/api";
import { INumbersClient } from "@fonoster/numbers";
import {
  CreateNumberRequest,
  CreateNumberResponse,
  DeleteNumberResponse,
  GetNumberResponse,
  ListNumbersRequest,
  ListNumbersResponse,
  UpdateNumberRequest,
  UpdateNumberResponse,
  GetIngressInfoRequest,
  GetIngressInfoResponse
} from "../../numbers/src/client/types";
import { WebClientOptions } from "./types";
import WebAPIClient from "./web_client";

export default class Numbers extends WebAPIClient implements INumbersClient {
  constructor(options: WebClientOptions) {
    super(c, "NumbersApi", options);
  }

  async createNumber(
    request: CreateNumberRequest
  ): Promise<CreateNumberResponse> {
    return (await super.run("createNumber", request)) as any;
  }

  async getNumber(ref: string): Promise<GetNumberResponse> {
    return (await super.run("getNumber", ref)) as any;
  }

  async updateNumber(
    request: UpdateNumberRequest
  ): Promise<UpdateNumberResponse> {
    return (await super.run("updateNumber", request)) as any;
  }

  async listNumbers(request: ListNumbersRequest): Promise<ListNumbersResponse> {
    return (await super.run("listNumbers", request)) as any;
  }

  async deleteNumber(ref: string): Promise<DeleteNumberResponse> {
    return (await super.run("deleteNumber", ref)) as any;
  }

  async getIngressInfo(
    request: GetIngressInfoRequest
  ): Promise<GetIngressInfoResponse> {
    return (await super.run("getIngressInfo", request)) as any;
  }
}
