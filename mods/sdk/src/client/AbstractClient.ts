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
import { exchangeToken } from "./exchangeToken";
import { FonosterClient } from "./types";
import {
  ExchangeApiKeyRequest,
  ExchangeCredentialsRequest,
  ExchangeRefreshTokenRequest
} from "../generated/node/identity_pb";

abstract class AbstractClient implements FonosterClient {
  protected accessKeyId: string;
  protected accessToken: string;
  protected _refreshToken: string;
  protected identityClient;

  constructor(config: { accessKeyId: string; identityClient }) {
    this.accessKeyId = config.accessKeyId;
    this.identityClient = config.identityClient;
    this.accessToken = "";
    this._refreshToken = "";
  }

  async login(username: string, password: string): Promise<void> {
    const exchangeCredentialsRequest = new ExchangeCredentialsRequest();
    exchangeCredentialsRequest.setUsername(username);
    exchangeCredentialsRequest.setPassword(password);

    const { refreshToken, accessToken } = await exchangeToken(
      exchangeCredentialsRequest,
      this.identityClient.exchangeCredentials.bind(this.identityClient)
    );

    this._refreshToken = refreshToken;
    this.accessToken = accessToken;
  }

  async loginWithRefreshToken(refreshToken: string): Promise<void> {
    const exchangeRefreshTokenRequest = new ExchangeRefreshTokenRequest();
    exchangeRefreshTokenRequest.setRefreshToken(refreshToken);

    const { accessToken } = await exchangeToken(
      exchangeRefreshTokenRequest,
      this.identityClient.exchangeRefreshToken.bind(this.identityClient)
    );

    this.accessToken = accessToken;
  }

  async loginWithApiKey(apiKey: string): Promise<void> {
    const exchangeApiKeyRequest = new ExchangeApiKeyRequest();
    exchangeApiKeyRequest.setApiKey(apiKey);

    const { refreshToken, accessToken } = await exchangeToken(
      exchangeApiKeyRequest,
      this.identityClient.exchangeApiKey.bind(this.identityClient)
    );

    this._refreshToken = refreshToken;
    this.accessToken = accessToken;
  }

  protected async refreshToken(): Promise<void> {
    return await this.loginWithRefreshToken(this._refreshToken);
  }

  getAccessKeyId(): string {
    return this.accessKeyId;
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  abstract getMetadata(): unknown;
  abstract getDomainsClient(): unknown;
}

export { AbstractClient };
