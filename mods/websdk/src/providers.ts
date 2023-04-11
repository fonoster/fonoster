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
import { IProvidersClient } from "@fonoster/providers";
import {
  CreateProviderRequest,
  CreateProviderResponse,
  DeleteProviderResponse,
  GetProviderResponse,
  ListProvidersRequest,
  ListProvidersResponse,
  UpdateProviderRequest,
  UpdateProviderResponse
} from "../../providers/src/client/types";
import WebAPIClient from "./web_client";
import { WebClientOptions } from "./types";

export default class Providers
  extends WebAPIClient
  implements IProvidersClient
{
  constructor(options: WebClientOptions) {
    super(c, "ProvidersApi", options);
  }

  async createProvider(
    request: CreateProviderRequest
  ): Promise<CreateProviderResponse> {
    return (await super.run("createProvider", request)) as any;
  }

  async getProvider(ref: string): Promise<GetProviderResponse> {
    return (await super.run("getProvider", ref)) as any;
  }

  async updateProvider(
    request: UpdateProviderRequest
  ): Promise<UpdateProviderResponse> {
    return (await super.run("updateProvider", request)) as any;
  }

  async listProviders(
    request: ListProvidersRequest
  ): Promise<ListProvidersResponse> {
    return (await super.run("listProviders", request)) as any;
  }

  async deleteProvider(ref: string): Promise<DeleteProviderResponse> {
    return (await super.run("deleteProvider", ref)) as any;
  }
}
