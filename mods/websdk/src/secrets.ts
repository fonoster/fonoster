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
import { ISecretsClient } from "@fonoster/secrets";
import {
  CreateSecretRequest,
  CreateSecretResponse,
  GetSecretResponse,
  ListSecretsRequest,
  ListSecretsResponse
} from "../../secrets/src/client/types";
import { WebClientOptions } from "./types";
import WebAPIClient from "./web_client";

export default class Secrets extends WebAPIClient implements ISecretsClient {
  constructor(options: WebClientOptions) {
    super(c, "SecretsApi", options);
  }

  async createSecret(
    request: CreateSecretRequest
  ): Promise<CreateSecretResponse> {
    return (await super.run("createSecret", request)) as any;
  }

  async getSecret(ref: string): Promise<GetSecretResponse> {
    return (await super.run("getSecret", ref)) as any;
  }

  async deleteSecret(ref: string): Promise<void> {
    return (await super.run("updateSecret", ref)) as any;
  }

  async listSecrets(request: ListSecretsRequest): Promise<ListSecretsResponse> {
    return (await super.run("listSecrets", request)) as any;
  }
}
