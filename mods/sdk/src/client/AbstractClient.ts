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

import { makeRpcRequest } from "./makeRpcRequest";
import { ApplicationsClient, FonosterClient, IdentityClient } from "./types";
import {
  ExchangeApiKeyRequest as ExchangeApiKeyRequestPB,
  ExchangeCredentialsRequest as ExchangeCredentialsRequestPB,
  ExchangeCredentialsResponse as ExchangeCredentialsResponsePB,
  ExchangeRefreshTokenRequest as ExchangeRefreshTokenRequestPB
} from "../generated/node/identity_pb";

abstract class AbstractClient implements FonosterClient {
  protected idToken: string;
  protected accessKeyId: string;
  protected accessToken: string;
  protected _refreshToken: string;
  protected identityClient: IdentityClient;

  constructor(config: { accessKeyId: string; identityClient: IdentityClient }) {
    this.accessKeyId = config.accessKeyId;
    this.identityClient = config.identityClient;
    this.accessToken = "";
    this._refreshToken = "";
  }

  async login(username: string, password: string): Promise<void> {
    const { refreshToken, accessToken } = await makeRpcRequest<
      ExchangeCredentialsRequestPB,
      ExchangeCredentialsResponsePB,
      { username: string; password: string },
      { refreshToken: string; accessToken: string }
    >(
      this.identityClient.exchangeCredentials.bind(this.identityClient),
      ExchangeCredentialsRequestPB,
      {},
      {
        username,
        password
      }
    );

    this._refreshToken = refreshToken;
    this.accessToken = accessToken;
  }

  async loginWithRefreshToken(refreshToken: string): Promise<void> {
    const { accessToken } = await makeRpcRequest<
      ExchangeRefreshTokenRequestPB,
      ExchangeCredentialsResponsePB,
      { refreshToken: string },
      { accessToken: string }
    >(
      this.identityClient.exchangeRefreshToken,
      ExchangeRefreshTokenRequestPB,
      {},
      {
        refreshToken
      }
    );

    this.accessToken = accessToken;
  }

  async loginWithApiKey(apiKey: string): Promise<void> {
    const { refreshToken, accessToken } = await makeRpcRequest<
      ExchangeApiKeyRequestPB,
      ExchangeCredentialsResponsePB,
      { apiKey: string },
      { refreshToken: string; accessToken: string }
    >(
      this.identityClient.exchangeApiKey,
      ExchangeApiKeyRequestPB,
      {},
      {
        apiKey
      }
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
  abstract getApplicationsClient(): ApplicationsClient;
}

export { AbstractClient };
