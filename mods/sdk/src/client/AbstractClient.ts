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
import { ContactType } from "@fonoster/types";
import {
  ContactType as ContactTypePB,
  ExchangeApiKeyRequest as ExchangeApiKeyRequestPB,
  ExchangeCredentialsRequest as ExchangeCredentialsRequestPB,
  ExchangeCredentialsResponse as ExchangeCredentialsResponsePB,
  ExchangeOauth2CodeRequest as ExchangeOauth2CodeRequestPB,
  ExchangeOauth2CodeResponse as ExchangeOauth2CodeResponsePB,
  ExchangeRefreshTokenRequest as ExchangeRefreshTokenRequestPB,
  SendVerificationCodeRequest as SendVerificationCodeRequestPB,
  VerifyCodeRequest as VerifyCodeRequestPB
} from "../generated/node/identity_pb";
import { makeRpcRequest } from "./makeRpcRequest";
import {
  ApplicationsClient,
  CallsClient,
  FonosterClient,
  IdentityClient,
  SecretsClient
} from "./types";
import { AclsClient } from "./types/AclsClient";
import { AgentsClient } from "./types/AgentsClient";
import { CredentialsClient } from "./types/CredentialsClient";
import { DomainsClient } from "./types/DomainsClient";
import { NumbersClient } from "./types/NumbersClient";
import { TrunksClient } from "./types/TrunksClient";

abstract class AbstractClient implements FonosterClient {
  protected accessKeyId: string;
  protected _accessToken: string;
  protected _refreshToken: string;
  protected _idToken: string;
  protected identityClient: IdentityClient;

  constructor(config: { accessKeyId: string; identityClient: IdentityClient }) {
    this.accessKeyId = config.accessKeyId;
    this.identityClient = config.identityClient;
    this._accessToken = "";
    this._refreshToken = "";
    this._idToken = "";
  }

  async login(
    username: string,
    password: string,
    twoFactorCode?: string
  ): Promise<void> {
    const { refreshToken, accessToken, idToken } = await makeRpcRequest<
      ExchangeCredentialsRequestPB,
      ExchangeCredentialsResponsePB,
      { username: string; password: string; twoFactorCode?: string },
      { refreshToken: string; accessToken: string; idToken: string }
    >({
      method: this.identityClient.exchangeCredentials.bind(this.identityClient),
      requestPBObjectConstructor: ExchangeCredentialsRequestPB,
      metadata: {},
      request: {
        username,
        password,
        twoFactorCode
      }
    });

    this._refreshToken = refreshToken;
    this._accessToken = accessToken;
    this._idToken = idToken;
  }

  logout() {
    this._refreshToken = "";
    this._accessToken = "";
    this._idToken = "";
  }

  async loginWithRefreshToken(refreshToken: string): Promise<void> {
    const {
      accessToken,
      refreshToken: newRefreshToken,
      idToken
    } = await makeRpcRequest<
      ExchangeRefreshTokenRequestPB,
      ExchangeCredentialsResponsePB,
      { refreshToken: string },
      { accessToken: string; refreshToken: string; idToken: string }
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
    this._idToken = idToken;
  }

  async loginWithApiKey(
    accessKeyId: string,
    accessKeySecret: string
  ): Promise<void> {
    const { refreshToken, accessToken } = await makeRpcRequest<
      ExchangeApiKeyRequestPB,
      ExchangeCredentialsResponsePB,
      { accessKeySecret: string; accessKeyId: string },
      { refreshToken: string; accessToken: string }
    >({
      method: this.identityClient.exchangeApiKey.bind(this.identityClient),
      requestPBObjectConstructor: ExchangeApiKeyRequestPB,
      metadata: {},
      request: {
        accessKeyId,
        accessKeySecret
      }
    });

    this._refreshToken = refreshToken;
    this._accessToken = accessToken;
  }

  async loginWithOauth2Code(provider: "GITHUB", code: string): Promise<void> {
    const { refreshToken, accessToken, idToken } = await makeRpcRequest<
      ExchangeOauth2CodeRequestPB,
      ExchangeOauth2CodeResponsePB,
      { provider: "GITHUB"; code: string },
      { refreshToken: string; accessToken: string; idToken: string }
    >({
      method: this.identityClient.exchangeOauth2Code.bind(this.identityClient),
      requestPBObjectConstructor: ExchangeOauth2CodeRequestPB,
      metadata: {},
      request: {
        provider,
        code
      },
      enumMapping: [["provider", ExchangeOauth2CodeRequestPB.Oauth2Provider]]
    });

    this._refreshToken = refreshToken;
    this._accessToken = accessToken;
    this._idToken = idToken;
  }

  setAccessToken(accessToken: string) {
    this._accessToken = accessToken;
  }

  async sendVerificationCode(
    contactType: ContactType,
    value: string
  ): Promise<void> {
    return makeRpcRequest<
      SendVerificationCodeRequestPB,
      null,
      { contactType: ContactType; value: string },
      never
    >({
      method: this.identityClient.sendVerificationCode.bind(
        this.identityClient
      ),
      requestPBObjectConstructor: SendVerificationCodeRequestPB,
      metadata: {},
      request: {
        contactType,
        value
      },
      enumMapping: [["contactType", ContactTypePB]]
    });
  }

  async verifyCode(request: {
    username: string;
    contactType: ContactType;
    value: string;
    verificationCode: string;
  }): Promise<void> {
    return makeRpcRequest<
      VerifyCodeRequestPB,
      null,
      {
        username: string;
        contactType: ContactType;
        value: string;
        verificationCode: string;
      },
      never
    >({
      method: this.identityClient.verifyCode.bind(this.identityClient),
      requestPBObjectConstructor: VerifyCodeRequestPB,
      metadata: {},
      request,
      enumMapping: [["contactType", ContactTypePB]]
    });
  }

  async refreshToken(): Promise<void> {
    return this.loginWithRefreshToken(this._refreshToken);
  }

  getAccessKeyId(): string {
    return this.accessKeyId;
  }

  setAccessKeyId(accessKeyId: string) {
    this.accessKeyId = accessKeyId;
  }

  getAccessToken(): string {
    return this._accessToken;
  }

  getRefreshToken(): string {
    return this._refreshToken;
  }

  getIdToken(): string {
    return this._idToken;
  }

  abstract getMetadata(): unknown;
  abstract getApplicationsClient(): ApplicationsClient;
  abstract getIdentityClient(): IdentityClient;
  abstract getSecretsClient(): SecretsClient;
  abstract getAgentsClient(): AgentsClient;
  abstract getNumbersClient(): NumbersClient;
  abstract getCredentialsClient(): CredentialsClient;
  abstract getDomainsClient(): DomainsClient;
  abstract getTrunksClient(): TrunksClient;
  abstract getAclsClient(): AclsClient;
  abstract getCallsClient(): CallsClient;
}

export { AbstractClient };
