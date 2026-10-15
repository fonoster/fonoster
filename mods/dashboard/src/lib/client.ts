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
import * as SDK from "@fonoster/sdk";

export type FonosterSdk = ReturnType<typeof createSdk>;

export function createClient(apiUrl: string) {
  return new SDK.WebClient({ url: apiUrl, accessKeyId: "" });
}

/** One wrapper per API area, all sharing the same signed-in client. */
export function createSdk(client: SDK.WebClient) {
  return {
    acls: new SDK.Acls(client),
    agents: new SDK.Agents(client),
    apiKeys: new SDK.ApiKeys(client),
    applications: new SDK.Applications(client),
    calls: new SDK.Calls(client),
    callRecords: new SDK.CallRecords(client),
    credentials: new SDK.Credentials(client),
    domains: new SDK.Domains(client),
    numbers: new SDK.Numbers(client),
    regions: new SDK.Regions(client),
    providers: new SDK.Providers(client),
    secrets: new SDK.Secrets(client),
    trunks: new SDK.Trunks(client),
    users: new SDK.Users(client),
    webhooks: new SDK.Webhooks(client),
    workspaces: new SDK.Workspaces(client)
  };
}

export type { Capabilities, AuthMethod, WebClient } from "@fonoster/sdk";
