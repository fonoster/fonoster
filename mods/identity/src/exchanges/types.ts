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

/** A workspace as the control plane's regions code reads it. */
type RegionWorkspace = {
  ref: string;
  accessKeyId: string;
  name: string;
  ownerRef: string;
  region: string;
};

/**
 * Workspace ↔ region binding (add-private-regions PR-1, PR-14, PR-15), provided by the control
 * plane. Without it every workspace is on the default public region.
 */
type WorkspaceRegionHooks = {
  publicRegions: string[];
  defaultRegion: string;
  /**
   * The `region` to store for what the caller picked (an offered public id, or one of the
   * caller's private regions by id or ref); throws (status 400) for anything else.
   */
  resolveRegion(
    ownerRef: string,
    requested?: string
  ): Promise<{ region: string }>;
  /** A workspace joined (created) or left (deleted) a region. */
  workspaceChanged(workspace: { accessKeyId: string; region: string }): void;
  /** Identity hands the control plane read access to its workspaces. */
  attachDirectory?(directory: {
    workspace(accessKeyId: string): Promise<RegionWorkspace | undefined>;
    inRegion(region: string): Promise<RegionWorkspace[]>;
  }): void;
};

type IdentityConfig = {
  /** Workspace regions (control plane); absent means the default public region only. */
  regions?: WorkspaceRegionHooks;
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
  /**
   * The page password-reset emails link to (`?token=…` is appended). Built
   * from configuration, never from the request. Defaults to
   * `<issuer>/reset-password`.
   */
  resetPasswordUrl?: string;
  contactVerificationRequired: boolean;
  twoFactorAuthenticationRequired: boolean;
  /** Absent when outgoing email isn't configured; sending email then fails clearly. */
  smtpConfig?: {
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
    /** Defaults to https://github.com. */
    url?: string;
    /** Defaults to https://api.github.com. */
    apiUrl?: string;
  };
  /** Sign-in methods and sign-up policy, from features.auth. */
  auth: {
    methods: Array<"password" | "email_code" | "github">;
    signup: "invite" | "open";
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
  RegionWorkspace,
  WorkspaceRegionHooks,
  ExchangeApiKeysRequest,
  ExchangeCredentialsRequest,
  ExchangeOauth2CodeRequest,
  ExchangeRefreshTokenRequest,
  ExchangeResponse,
  IdentityConfig
};
