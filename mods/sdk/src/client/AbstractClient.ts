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
import {
  ApplicationsClient,
  CallsClient,
  FonosterClient,
  IdentityClient
} from "./types";
import {
  ExchangeApiKeyRequest as ExchangeApiKeyRequestPB,
  ExchangeCredentialsRequest as ExchangeCredentialsRequestPB,
  ExchangeCredentialsResponse as ExchangeCredentialsResponsePB,
  ExchangeRefreshTokenRequest as ExchangeRefreshTokenRequestPB
} from "../generated/node/identity_pb";

abstract class AbstractClient implements FonosterClient {
  protected idToken: string;
  protected accessKeyId: string;
  protected _accessToken: string;
  protected _refreshToken: string;
  protected identityClient: IdentityClient;

  constructor(config: { accessKeyId: string; identityClient: IdentityClient }) {
    this.accessKeyId = config.accessKeyId;
    this.identityClient = config.identityClient;
    this._accessToken = "";
    this._refreshToken = "";
  }

  async login(username: string, password: string): Promise<void> {
    const { refreshToken, accessToken } = await makeRpcRequest<
      ExchangeCredentialsRequestPB,
      ExchangeCredentialsResponsePB,
      { username: string; password: string },
      { refreshToken: string; accessToken: string }
    >({
      method: this.identityClient.exchangeCredentials.bind(this.identityClient),
      requestPBObjectConstructor: ExchangeCredentialsRequestPB,
      metadata: {},
      request: {
        username,
        password
      }
    });

    this._refreshToken = refreshToken;
    this._accessToken = accessToken;
  }

  async loginWithRefreshToken(refreshToken: string): Promise<void> {
    const { accessToken, refreshToken: newRefreshToken } = await makeRpcRequest<
      ExchangeRefreshTokenRequestPB,
      ExchangeCredentialsResponsePB,
      { refreshToken: string },
      { accessToken: string; refreshToken: string }
    >({
      method: this.identityClient.exchangeRefreshToken.bind(
        this.identityClient
      ),
      requestPBObjectConstructor: ExchangeRefreshTokenRequestPB,
      metadata: {},
      request: {
        refreshToken
      }
    });

    this._refreshToken = newRefreshToken;
    this._accessToken = accessToken;
  }

  async loginWithApiKey(apiKey: string): Promise<void> {
    const { refreshToken, accessToken } = await makeRpcRequest<
      ExchangeApiKeyRequestPB,
      ExchangeCredentialsResponsePB,
      { apiKey: string },
      { refreshToken: string; accessToken: string }
    >({
      method: this.identityClient.exchangeApiKey,
      requestPBObjectConstructor: ExchangeApiKeyRequestPB,
      metadata: {},
      request: {
        apiKey
      }
    });

    this._refreshToken = refreshToken;
    this._accessToken = accessToken;
  }

  async refreshToken(): Promise<void> {
    return await this.loginWithRefreshToken(this._refreshToken);
  }

  getAccessKeyId(): string {
    return this.accessKeyId;
  }

  getAccessToken(): string {
    return this._accessToken;
  }

  getRefreshToken(): string {
    return this._refreshToken;
  }

  abstract getMetadata(): unknown;
  abstract getApplicationsClient(): ApplicationsClient;
  abstract getCallsClient(): CallsClient;
}

export { AbstractClient };
