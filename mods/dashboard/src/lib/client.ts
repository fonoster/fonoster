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
import {
  createSessionApi,
  type SessionApi,
  type SessionTokens
} from "./session";

export type FonosterSdk = ReturnType<typeof createSdk>;

/**
 * The SDK's WebClient with the dashboard's cookie session (M4): after a
 * sign-in the refresh token goes to the httpOnly cookie and is dropped from
 * memory, and refreshing (also what the SDK does when it finds the access
 * token expired) goes through the cookie. If the session endpoint isn't there
 * (a dev server without Envoy, an older API), the refresh token stays in
 * memory only: the session just doesn't survive a reload.
 */
export class DashboardClient extends SDK.WebClient {
  private refreshing: Promise<void> | null = null;

  constructor(
    apiUrl: string,
    private readonly session: SessionApi = createSessionApi()
  ) {
    super({ url: apiUrl, accessKeyId: "" });
  }

  private take(tokens: SessionTokens) {
    this._accessToken = tokens.accessToken;
    this._idToken = tokens.idToken;
    this._refreshToken = "";
  }

  /** Moves a fresh sign-in's refresh token into the cookie. */
  private async keep() {
    try {
      this.take(await this.session.adopt(this._refreshToken));
    } catch {
      // No cookie session: keep the token in memory (never in storage).
    }
  }

  async login(username: string, password: string, twoFactorCode?: string) {
    await super.login(username, password, twoFactorCode);
    await this.keep();
  }

  async loginWithVerificationCode(email: string, code: string) {
    await super.loginWithVerificationCode(email, code);
    await this.keep();
  }

  async loginWithOauth2Code(provider: "GITHUB", code: string) {
    await super.loginWithOauth2Code(provider, code);
    await this.keep();
  }

  /** Moves a refresh token from an older dashboard's localStorage into the cookie. */
  async adoptRefreshToken(refreshToken: string) {
    this.take(await this.session.adopt(refreshToken));
  }

  /** New tokens from the cookie (or the in-memory token); one refresh at a time. */
  async refreshToken(): Promise<void> {
    this.refreshing ??= (
      this._refreshToken
        ? super.refreshToken()
        : this.session.refresh().then((tokens) => this.take(tokens))
    ).finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  /** Forgets the tokens and revokes the session on the server (best effort). */
  async logout() {
    const inMemory = Boolean(this._refreshToken);
    await super.logout();
    if (!inMemory) await this.session.logout().catch(() => undefined);
  }
}

export function createClient(apiUrl: string) {
  return new DashboardClient(apiUrl);
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
    usage: new SDK.Usage(client),
    users: new SDK.Users(client),
    webhooks: new SDK.Webhooks(client),
    workspaces: new SDK.Workspaces(client)
  };
}

export type { Capabilities, AuthMethod, WebClient } from "@fonoster/sdk";
