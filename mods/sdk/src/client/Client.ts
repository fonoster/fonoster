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
import { credentials } from "@grpc/grpc-js";
import { DomainsClient } from "../generated/node/domains_grpc_pb";

const DEFAULT_ENDPOINT = "api.fonoster.io:50051";

export class Client {
  private endpoint: string;
  private token: string;
  private accessKeyId: string;
  credentials: any;

  constructor(config: { endpoint?: string; accessKeyId: string }) {
    this.endpoint = config?.endpoint || DEFAULT_ENDPOINT;
    this.accessKeyId = config.accessKeyId;
    this.token = "";
    this.credentials = credentials.createInsecure();
  }

  getTokens() {
    return this.token;
  }

  getAccessKeyId() {
    return this.accessKeyId;
  }

  login(username: string, password: string) {
    // Nyi
  }

  loginWithToken(token: string) {
    this.token = token;
  }

  getDomainsClient() {
    return new DomainsClient(this.endpoint, credentials.createInsecure());
  }
}
