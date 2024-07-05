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
import { FonosterClient } from "./types";
import {
  ExchangeApiKeyRequest,
  ExchangeCredentialsRequest,
  ExchangeRefreshTokenRequest
} from "../generated/node/identity_pb";

type ExchangeRequest =
  | ExchangeApiKeyRequest
  | ExchangeCredentialsRequest
  | ExchangeRefreshTokenRequest;

abstract class AbstractClient implements FonosterClient {
  protected accessKeyId: string;
  protected accessToken: string;
  protected _refreshToken: string;
  protected identityClient;

  constructor(config: { accessKeyId: string; identityClient }) {
    this.accessKeyId = config.accessKeyId;
    this.identityClient = config.identityClient;
    this.accessToken = "";
  }

  private async exchangeToken(
    request: ExchangeRequest,
    exchangeMethod: (req, meta, callback) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      exchangeMethod(request, {}, (err, response) => {
        if (err) {
          reject(err);
        }

        this.accessToken = response?.getAccessToken();
        this._refreshToken = response?.getRefreshToken();

        resolve();
      });
    });
  }

  async login(username: string, password: string): Promise<void> {
    const exchangeCredentialsRequest = new ExchangeCredentialsRequest();
    exchangeCredentialsRequest.setUsername(username);
    exchangeCredentialsRequest.setPassword(password);

    await this.exchangeToken(
      exchangeCredentialsRequest,
      this.identityClient.exchangeCredentials.bind(this.identityClient)
    );
  }

  async loginWithRefreshToken(refreshToken: string): Promise<void> {
    const exchangeRefreshTokenRequest = new ExchangeRefreshTokenRequest();
    exchangeRefreshTokenRequest.setRefreshToken(refreshToken);

    await this.exchangeToken(
      exchangeRefreshTokenRequest,
      this.identityClient.exchangeRefreshToken.bind(this.identityClient)
    );
  }

  async loginWithApiKey(apiKey: string): Promise<void> {
    const exchangeApiKeyRequest = new ExchangeApiKeyRequest();
    exchangeApiKeyRequest.setApiKey(apiKey);

    await this.exchangeToken(
      exchangeApiKeyRequest,
      this.identityClient.exchangeApiKey.bind(this.identityClient)
    );
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
