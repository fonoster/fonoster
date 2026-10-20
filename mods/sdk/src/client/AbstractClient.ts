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
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { GetCapabilitiesResponse as GetCapabilitiesResponsePB } from "../generated/node/capabilities_pb";
import {
  ContactType as ContactTypePB,
  ExchangeApiKeyRequest as ExchangeApiKeyRequestPB,
  ExchangeCredentialsRequest as ExchangeCredentialsRequestPB,
  ExchangeCredentialsResponse as ExchangeCredentialsResponsePB,
  ExchangeOauth2CodeRequest as ExchangeOauth2CodeRequestPB,
  ExchangeOauth2CodeResponse as ExchangeOauth2CodeResponsePB,
  ExchangeRefreshTokenRequest as ExchangeRefreshTokenRequestPB,
  ExchangeVerificationCodeRequest as ExchangeVerificationCodeRequestPB,
  ExchangeVerificationCodeResponse as ExchangeVerificationCodeResponsePB,
  RevokeTokenRequest as RevokeTokenRequestPB,
  RevokeTokenResponse as RevokeTokenResponsePB,
  SendVerificationCodeRequest as SendVerificationCodeRequestPB,
  VerifyCodeRequest as VerifyCodeRequestPB
} from "../generated/node/identity_pb";
import { makeRpcRequest } from "./makeRpcRequest";
import {
  ApplicationsClient,
  CallsClient,
  CapabilitiesClient,
  FonosterClient,
  IdentityClient,
  SecretsClient
} from "./types";
import { AclsClient } from "./types/AclsClient";
import { AgentsClient } from "./types/AgentsClient";
import { BillingClient } from "./types/BillingClient";
import { CredentialsClient } from "./types/CredentialsClient";
import { DomainsClient } from "./types/DomainsClient";
import { NumbersClient } from "./types/NumbersClient";
import { ProvidersClient } from "./types/ProvidersClient";
import { TrunksClient } from "./types/TrunksClient";
import { UsageClient } from "./types/UsageClient";
import { WebhooksClient } from "./types/WebhooksClient";

type AuthMethod = "password" | "email_code" | "github";

/** The deployment's capabilities, from the Capabilities service. */
type Capabilities = {
  auth: {
    methods: AuthMethod[];
    signup: "invite" | "open";
    github?: { clientId: string; authorizeUrl: string };
  };
  billing: { enabled: boolean };
  costs: { display: "none" | "usage" | "prices" };
  domain: string;
  appUrl: string;
  /**
   * `private` is true only when the operator configured the region hub, so
   * workspaces can enroll private regions. The local public region always
   * exists and is not a reason to show region features.
   */
  regions: { private: boolean };
  /**
   * Where carriers and softphones reach this deployment (its default public
   * region): SIP endpoints, addresses to allowlist and the RTP port range.
   * Empty lists when the operator listed none or the server is older.
   */
  connection: ConnectionDetails;
  /**
   * How SIP names (trunk inbound URIs, domains) are checked: "domain" (one
   * label under `sip.<domain>`, the default) or "any" (any host or IP).
   */
  sip: { names: "domain" | "any" };
};

type SipTransport = "udp" | "tcp" | "tls" | "ws" | "wss";

type ConnectionDetails = {
  sip: { host: string; port: number; transport: SipTransport }[];
  signalingAddresses: string[];
  mediaAddresses: string[];
  rtpPorts?: { min: number; max: number };
};

/** The Capabilities response's connection details as plain values. */
function toConnectionDetails(
  response: GetCapabilitiesResponsePB
): ConnectionDetails {
  const c = response.getConnection();
  const ports = c?.getRtpPorts();
  return {
    sip: (c?.getSipList() ?? []).map((s) => ({
      host: s.getHost(),
      port: s.getPort(),
      transport: s.getTransport() as SipTransport
    })),
    signalingAddresses: c?.getSignalingAddressesList() ?? [],
    mediaAddresses: c?.getMediaAddressesList() ?? [],
    rtpPorts: ports ? { min: ports.getMin(), max: ports.getMax() } : undefined
  };
}

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

  /**
   * Signs out: forgets the tokens (right away, before the call returns) and
   * revokes the refresh token on the server, so it can no longer be exchanged.
   * Revocation is best effort: an unreachable server or an already-refused
   * token does not make sign-out fail. Access tokens already issued stay valid
   * until they expire.
   */
  async logout(): Promise<void> {
    const refreshToken = this._refreshToken;
    this._refreshToken = "";
    this._accessToken = "";
    this._idToken = "";
    if (!refreshToken) return;
    await this.revokeToken(refreshToken).catch(() => undefined);
  }

  /**
   * Revokes `refreshToken` and every token rotated from the same sign-in.
   * Needs no access token: holding the refresh token is the authorization.
   */
  async revokeToken(refreshToken: string): Promise<void> {
    await makeRpcRequest<
      RevokeTokenRequestPB,
      RevokeTokenResponsePB,
      { token: string },
      { token: string }
    >({
      method: this.identityClient.revokeToken.bind(this.identityClient),
      requestPBObjectConstructor: RevokeTokenRequestPB,
      metadata: {},
      request: { token: refreshToken }
    });
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

  /**
   * Passwordless sign-in: trades the 6-digit code emailed by
   * `sendVerificationCode(ContactType.EMAIL, email)` for tokens.
   */
  async loginWithVerificationCode(email: string, code: string): Promise<void> {
    const { refreshToken, accessToken, idToken } = await makeRpcRequest<
      ExchangeVerificationCodeRequestPB,
      ExchangeVerificationCodeResponsePB,
      { email: string; code: string },
      { refreshToken: string; accessToken: string; idToken: string }
    >({
      method: this.identityClient.exchangeVerificationCode.bind(
        this.identityClient
      ),
      requestPBObjectConstructor: ExchangeVerificationCodeRequestPB,
      metadata: {},
      request: { email, code }
    });

    this._refreshToken = refreshToken;
    this._accessToken = accessToken;
    this._idToken = idToken;
  }

  /**
   * What the deployment supports (from the server's fonoster.yaml): sign-in
   * methods, sign-up policy, the GitHub client id when enabled, billing, cost
   * display, domain and app URL. Needs no credentials.
   */
  async getCapabilities(): Promise<Capabilities> {
    return new Promise((resolve, reject) => {
      this.getCapabilitiesClient().getCapabilities(
        new Empty(),
        {},
        (error: Error | null, response: GetCapabilitiesResponsePB) => {
          if (error) {
            reject(error);
            return;
          }

          const auth = response.getAuth();
          const github = auth?.getGithub();

          resolve({
            auth: {
              methods: (auth?.getMethodsList() ?? []) as AuthMethod[],
              signup: (auth?.getSignup() ||
                "invite") as Capabilities["auth"]["signup"],
              github: github
                ? {
                    clientId: github.getClientId(),
                    authorizeUrl: github.getAuthorizeUrl()
                  }
                : undefined
            },
            billing: { enabled: response.getBilling()?.getEnabled() ?? false },
            costs: {
              display: (response.getCosts()?.getDisplay() ||
                "none") as Capabilities["costs"]["display"]
            },
            domain: response.getDomain(),
            appUrl: response.getAppUrl(),
            regions: {
              private: response.getRegions()?.getPrivate() ?? false
            },
            connection: toConnectionDetails(response),
            sip: {
              // Older servers don't send it; they checked nothing.
              names:
                response.getSip()?.getNames() === "domain" ? "domain" : "any"
            }
          });
        }
      );
    });
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
  abstract getCapabilitiesClient(): CapabilitiesClient;
  abstract getSecretsClient(): SecretsClient;
  abstract getAgentsClient(): AgentsClient;
  abstract getNumbersClient(): NumbersClient;
  abstract getCredentialsClient(): CredentialsClient;
  abstract getDomainsClient(): DomainsClient;
  abstract getTrunksClient(): TrunksClient;
  abstract getAclsClient(): AclsClient;
  abstract getCallsClient(): CallsClient;
  abstract getWebhooksClient(): WebhooksClient;
  abstract getProvidersClient(): ProvidersClient;
  abstract getUsageClient(): UsageClient;
  abstract getBillingClient(): BillingClient;
  abstract getHttpUrl(): string;
}

export {
  AbstractClient,
  AuthMethod,
  Capabilities,
  ConnectionDetails,
  toConnectionDetails
};
