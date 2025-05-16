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
import { Validators as V } from "@fonoster/common";
import { z } from "zod";

type IdentityConfig = {
  dbUrl: string;
  issuer: string;
  audience: string;
  privateKey: string;
  publicKey: string;
  encryptionKey: string;
  accessTokenExpiresIn: number | string;
  refreshTokenExpiresIn: number | string;
  idTokenExpiresIn: number | string;
  workspaceInviteExpiration: string;
  workspaceInviteUrl: string;
  workspaceInviteFailUrl: string;
  contactVerificationRequired: boolean;
  twoFactorAuthenticationRequired: boolean;
  smtpConfig: {
    sender: string;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  twilioSmsConfig?: {
    accountSid: string;
    authToken: string;
    sender: string;
  };
  githubOauth2Config?: {
    clientId: string;
    clientSecret: string;
  };
};

type ExchangeApiKeysRequest = z.infer<typeof V.exchangeApiKeysRequestSchema>;

type ExchangeOauth2CodeRequest = z.infer<typeof V.exchangeOauth2RequestSchema>;

type ExchangeCredentialsRequest = z.infer<
  typeof V.exchangeCredentialsRequestSchema
>;

type ExchangeResponse = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

type ExchangeRefreshTokenRequest = z.infer<
  typeof V.exchangeRefreshTokenRequestSchema
>;

export {
  ExchangeApiKeysRequest,
  ExchangeCredentialsRequest,
  ExchangeOauth2CodeRequest,
  ExchangeRefreshTokenRequest,
  ExchangeResponse,
  IdentityConfig
};
